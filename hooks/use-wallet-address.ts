"use client";
import { useQuery } from "@tanstack/react-query";
import { getWalletAddress } from "@/rpc";

export const useWalletAddress = (walletId?: string) => {
	return useQuery({
		queryKey: ["wallet-address", walletId],
		queryFn: () => {
			if (!walletId) throw new Error("Wallet ID is required");
			return getWalletAddress(walletId);
		},
		enabled: !!walletId,
	});
};
