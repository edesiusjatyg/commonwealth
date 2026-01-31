"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import type { UpdateProfileInput } from "@/rpc";
import * as rpc from "@/rpc";
import { useCurrentWallet } from "./use-current-wallet";
import { useUser } from "./use-user";

// UI-friendly profile type
export type Profile = {
	walletId: string;
	email: string;
	nickname: string;
	dailyLimit: number;
	emergencyEmail: string[]; // Simple array of email strings
	walletAddress: string;
};

/**
 * Hook to fetch profile data
 * Consolidates data from getCurrentWallet, getCurrentUser, and getProfile
 * Follows architecture: UI → Hook → RPC → Server Action
 */
export function useProfile() {
	const { data: wallet, isLoading: isWalletLoading } = useCurrentWallet();
	const { data: user, isLoading: isUserLoading } = useUser();

	const profileQuery = useQuery({
		queryKey: queryKeys.profile.detail(wallet?.id),
		queryFn: async (): Promise<Profile> => {
			if (!wallet?.id) {
				throw new Error("No active wallet found");
			}

			// Fetch full profile data
			const profileData = await rpc.fetchProfile(wallet.id);

			if (profileData.error) {
				throw new Error(profileData.error);
			}

			return {
				walletId: wallet.id,
				email: profileData.email,
				nickname: profileData.nickname,
				dailyLimit: profileData.dailyLimit,
				emergencyEmail: profileData.emergencyEmail || [],
				walletAddress: profileData.walletAddress,
			};
		},
		enabled: !!wallet?.id && !!user,
		// Use data from getCurrentWallet as initial data for faster loading
		placeholderData: wallet
			? {
					walletId: wallet.id || "",
					email: user?.email || "",
					nickname: wallet.name,
					dailyLimit: wallet.dailyLimit,
					emergencyEmail: [],
					walletAddress: wallet.address,
				}
			: undefined,
	});

	// Combine loading states from all dependencies
	return {
		...profileQuery,
		isLoading: isWalletLoading || isUserLoading || profileQuery.isLoading,
	};
}

/**
 * Hook to update profile data
 * Invalidates both profile and wallet queries on success
 */
export function useUpdateProfile() {
	const queryClient = useQueryClient();
	const { data: wallet } = useCurrentWallet();

	return useMutation({
		mutationFn: async (input: Omit<UpdateProfileInput, "walletId">) => {
			if (!wallet?.id) {
				throw new Error("No active wallet found");
			}

			const response = await rpc.updateProfileData({
				...input,
				walletId: wallet.id,
			});

			if (response.error) {
				throw new Error(response.error);
			}

			return response;
		},
		onSuccess: () => {
			// Invalidate both profile and wallet queries to refetch fresh data
			queryClient.invalidateQueries({
				queryKey: queryKeys.profile.detail(wallet?.id),
			});
			queryClient.invalidateQueries({
				queryKey: ["current-wallet"],
			});
			toast.success("Profile updated successfully");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update profile");
		},
	});
}
