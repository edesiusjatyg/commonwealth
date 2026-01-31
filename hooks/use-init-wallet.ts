"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as rpc from "@/rpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const emergencyContactSchema = z.object({
	email: z.string().email("Invalid email address"),
	name: z.string().optional(),
});

const initWalletSchema = z.object({
	name: z.string().min(1, "Wallet name is required"),
	emergencyContacts: z.array(emergencyContactSchema).length(2, "Exactly 2 emergency contacts are required"),
	dailyLimit: z.number().min(0, "Daily limit must be at least 0"),
});

export type InitWalletFormValues = z.infer<typeof initWalletSchema>;

export function useInitWallet(userId: string) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<InitWalletFormValues>({
		resolver: zodResolver(initWalletSchema),
		defaultValues: {
			name: "",
			emergencyContacts: [
				{ email: "", name: "" },
				{ email: "", name: "" },
			],
			dailyLimit: 1000,
		},
	});

	const emergencyContacts = form.watch("emergencyContacts");

	// Handler to update emergency contact email
	const updateContactEmail = (index: number, email: string) => {
		const current = form.getValues("emergencyContacts");
		const updated = [...current];
		updated[index] = {
			email,
			name: updated[index]?.name || "",
		};
		form.setValue("emergencyContacts", updated, { shouldValidate: true });
	};

	// Handler to update emergency contact name
	const updateContactName = (index: number, name: string) => {
		const current = form.getValues("emergencyContacts");
		const updated = [...current];
		updated[index] = {
			email: updated[index]?.email || "",
			name,
		};
		form.setValue("emergencyContacts", updated, { shouldValidate: true });
	};

	const mutation = useMutation({
		mutationFn: (values: InitWalletFormValues) => {
			const emails = values.emergencyContacts
				.map((contact) => contact.email)
				.filter(Boolean);
			const _values = {
				...values,
				emergencyEmail: emails,
			};
			console.debug("Setting up wallet with values:", values);
			console.debug("Setting up wallet with _values:", _values);
			return rpc.setupWallet({
				userId,
				..._values,
			});
		},
		onSuccess: (data) => {
			if (data.error) {
				toast.error("Failed to setup wallet", {
					description: data.error,
				});
				return;
			}

			toast.success("Wallet setup successful", {
				description: "Your smart wallet is ready to use.",
			});

			// Invalidate all related queries
			queryClient.invalidateQueries({ queryKey: ["user"] });
			queryClient.invalidateQueries({ queryKey: ["wallet"] });

			router.push("/");
		},
		onError: (error: Error) => {
			toast.error("Failed to setup wallet", {
				description: error.message || "An unexpected error occurred",
			});
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		mutation.mutate(values);
	});

	return {
		form,
		onSubmit,
		isPending: mutation.isPending,
		error: mutation.error,
		emergencyContacts,
		updateContactEmail,
		updateContactName,
	};
}
