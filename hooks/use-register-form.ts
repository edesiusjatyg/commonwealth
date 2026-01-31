"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import * as rpc from "@/rpc";
import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Password requirements for validation display
export const passwordRequirements = [
	{ label: "At least 8 characters", test: (p: string) => p.length >= 8 },
	{ label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
	{ label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
	{ label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

// Register form schema
const registerFormSchema = z
	.object({
		email: z.string().email("Invalid email address"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must contain an uppercase letter")
			.regex(/[a-z]/, "Password must contain a lowercase letter")
			.regex(/\d/, "Password must contain a number"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export function useRegisterForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();

	const form = useForm<RegisterFormData>({
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
		resolver: zodResolver(registerFormSchema),
		mode: "onChange", // Validate on change for real-time feedback
	});

	// Watch password for strength indicator
	const password = useWatch({
		control: form.control,
		name: "password",
		defaultValue: "",
	});

	const confirmPassword = useWatch({
		control: form.control,
		name: "confirmPassword",
		defaultValue: "",
	});

	// Password validation state
	const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
	const allRequirementsMet = passwordRequirements.every((req) => req.test(password));
   // console.log("passwordMatch", passwordsMatch)
   // console.log("allRequirementsMet", allRequirementsMet)

	const registerAction = (e: React.FormEvent) => {
		e.preventDefault();
		startTransition(() => {
			form.handleSubmit(async (data) => {
				const response = await rpc.registerUser({
					email: data.email,
					password: data.password,
				});

				if (response.error) {
					form.setError("root", { message: response.error });
					toast.error("Registration failed", {
						description: response.error,
					});
					return;
				}

				toast.success("Registration successful", {
					description: "Welcome! Setting up your account...",
				});

				if (response.userId) {
					// CRITICAL: Pre-populate the user cache with data from register response
					// This prevents the race condition where the cookie hasn't propagated yet
					queryClient.setQueryData(["user"], {
						id: response.userId,
						email: data.email,
						onboarded: false, // New users are never onboarded
					});
				}

				// Force a refetch after a delay to sync with server
				setTimeout(() => {
					queryClient.invalidateQueries({ queryKey: ["user"] });
				}, 500);

				// Redirect to onboarding since they just registered
				// router.push("/onboarding");
				router.replace("/onboarding");
				router.refresh();
			})();
		});
	};

	return {
		form,
		isPending,
		registerAction,
		// Password validation helpers
		password,
		confirmPassword,
		passwordsMatch,
		allRequirementsMet,
		passwordRequirements,
	};
}
