"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentWallet } from "@/rpc";

/**
 * Hook to get the currently active wallet for the signed-in user
 */
export const useCurrentWallet = () => {
	return useQuery({
		queryKey: ["current-wallet"],
		queryFn: fetchCurrentWallet,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};
