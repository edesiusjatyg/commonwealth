"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";

// UI-friendly wallet balance type
export type WalletBalance = {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
};

// Hook to get wallet balance
// Follows architecture: UI → Hook → RPC → Server Action
export function useWalletBalance(walletId?: string) {
  return useQuery({
    queryKey: queryKeys.wallet.balance(walletId),
    queryFn: async (): Promise<WalletBalance> => {
      if (!walletId) {
        throw new Error("Wallet ID is required");
      }
      const response = await rpc.getWalletBalance(walletId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      return {
        balance: response.balance,
        totalDeposits: response.totalDeposits,
        totalWithdrawals: response.totalWithdrawals,
      };
    },
    enabled: !!walletId,
  });
}
