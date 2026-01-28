"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";
import type { UpdateProfileInput } from "@/rpc";
import { toast } from "sonner";

// UI-friendly profile type
export type Profile = {
	email: string;
	nickname: string;
	dailyLimit: number;
	emergencyEmail: string | null;
	walletAddress: string;
};

/**
 * Hook to fetch profile data for a wallet
 * Follows architecture: UI → Hook → RPC → Server Action
 */
export function useProfile(walletId?: string) {
	return useQuery({
		queryKey: queryKeys.profile.detail(walletId),
		queryFn: async (): Promise<Profile> => {
			if (!walletId) {
				throw new Error("Wallet ID is required");
			}
			const response = await rpc.fetchProfile(walletId);

			if (response.error) {
				throw new Error(response.error);
			}

			return {
				email: response.email,
				nickname: response.nickname,
				dailyLimit: response.dailyLimit,
				emergencyEmail: response.emergencyEmail,
				walletAddress: response.walletAddress,
			};
		},
		enabled: !!walletId,
	});
}

/**
 * Hook to update profile data
 * Invalidates profile query on success
 */
export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateProfileInput) => {
			const response = await rpc.updateProfileData(input);

			if (response.error) {
				throw new Error(response.error);
			}

			return response;
		},
		onSuccess: (_, variables) => {
			// Invalidate profile query to refetch fresh data
			queryClient.invalidateQueries({
				queryKey: queryKeys.profile.detail(variables.walletId),
			});
			toast.success("Profile updated successfully");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update profile");
		},
	});
}
