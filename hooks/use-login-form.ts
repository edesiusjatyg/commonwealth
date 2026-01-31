"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import * as rpc from "@/rpc";
import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Login form schema
const loginFormSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export function useLoginForm() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const form = useForm<LoginFormData>({
		defaultValues: {
			email: "",
			password: "",
		},
		resolver: zodResolver(loginFormSchema),
	});

	const loginAction = (e: React.FormEvent) => {
		e.preventDefault();
		startTransition(() => {
			form.handleSubmit(async (data) => {
				const response = await rpc.loginUser(data);

				if (response.error) {
					form.setError("root", { message: response.error });
					toast.error("Login failed", {
						description: response.error,
					});
					return;
				}

				toast.success("Login successful");
				
				// // CRITICAL: Pre-populate the user cache with data from login response
				// // This prevents the race condition where the cookie hasn't propagated yet
				// if (response.userId) {
				// 	queryClient.setQueryData(["user"], {
				// 		id: response.userId,
				// 		email: data.email,
				// 		onboarded: response.onboarded ?? false,
				// 	});
				// }
				
				// // Force a refetch after a delay to sync with server
				// setTimeout(() => {
				// 	queryClient.invalidateQueries({ queryKey: ["user"] });
				// }, 500);
				
				// Redirect based on onboarding status
				if (response.onboarded) {
					// router.push("/home");
               router.replace("/home")
               router.refresh();
				} else {
               router.replace("/onboarding");
               router.refresh();
				}
			})();
		});
	};

	return {
		form,
		isPending,
		loginAction,
	};
}
