"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as rpc from "@/rpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { completeOnboarding } from "@/app/server/onboarding";

const initWalletSchema = z.object({
	name: z.string().min(1, "Wallet name is required"),
	emergencyEmail: z.string().email("Invalid emegergency email address").optional().or(z.literal("")),
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
			emergencyEmail: "",
			dailyLimit: 1000,
		},
	});

	const mutation = useMutation({
		mutationFn: (values: InitWalletFormValues) =>
			rpc.setupWallet({
				userId,
				...values,
				emergencyEmail: values.emergencyEmail || undefined,
			}),
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
		onError: (error: any) => {
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
	};
}
