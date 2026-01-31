"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import * as rpc from "@/rpc";
import { useTransition } from "react";

// Login form schema
const loginFormSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export function useLoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
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
				
				// Check for redirect parameter from middleware
				const redirectTo = searchParams.get("redirect");

				if (redirectTo) {
					// Redirect to the original protected route they tried to access
					router.push(redirectTo);
				} else {
					// Default redirect based on onboarding status
					if (response.onboarded) {
						router.push("/home");
					} else {
						router.push("/onboarding");
					}
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
