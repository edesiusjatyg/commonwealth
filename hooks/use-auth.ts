"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as rpc from "@/rpc";
import { toast } from "sonner";

// Login mutation hook
export function useLogin() {
	const router = useRouter();

	return useMutation({
		mutationFn: async (input: { email: string; password: string }) => {
			const response = await rpc.loginUser(input);

			if (response.error) {
				throw new Error(response.error);
			}

			return response;
		},
		onSuccess: (data) => {
			toast.success("Login successful");
			// Redirect based on onboarding status
			if (data.onboarded) {
				router.push("/home");
			} else {
				router.push("/onboarding");
			}
		},
		onError: (error: Error) => {
			toast.error("Login failed", {
				description: error.message,
			});
		},
	});
}

// Register mutation hook
export function useRegister() {
	const router = useRouter();

	return useMutation({
		mutationFn: async (input: { email: string; password: string }) => {
			const response = await rpc.registerUser(input);

			if (response.error) {
				throw new Error(response.error);
			}

			return response;
		},
		onSuccess: () => {
			toast.success("Registration successful", {
				description: "Please login with your new account",
			});
			router.push("/login");
		},
		onError: (error: Error) => {
			toast.error("Registration failed", {
				description: error.message,
			});
		},
	});
}

// Logout mutation hook
export function useLogout() {
	const router = useRouter();

	return useMutation({
		mutationFn: async () => {
			const response = await rpc.logoutUser();

			if (response.error) {
				throw new Error(response.error);
			}

			return response;
		},
		onSuccess: () => {
			toast.success("Logged out successfully");
			router.push("/login");
		},
		onError: (error: Error) => {
			toast.error("Logout failed", {
				description: error.message,
			});
		},
	});
}
