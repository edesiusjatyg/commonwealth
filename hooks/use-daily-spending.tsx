"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";

// TODO: Replace with actual wallet ID from user context when available
const MOCK_WALLET_ID = "mock-wallet-id";
// TODO: Replace with actual daily limit from wallet settings
const DEFAULT_DAILY_LIMIT = 2000000;

export type DailySpendingData = {
	currentSpending: number;
	maxDailySpending: number;
};

export const useDailySpending = (walletId?: string) => {
	const effectiveWalletId = walletId || MOCK_WALLET_ID;

	return useQuery({
		queryKey: queryKeys.wallet.dailySpending(effectiveWalletId),
		queryFn: async (): Promise<DailySpendingData> => {
			const response = await rpc.getWalletBalance(effectiveWalletId);

			if (response.error) {
				throw new Error(response.error);
			}

			// Calculate today's spending from withdrawals
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const todayWithdrawals = response.history
				.filter((tx) => {
					const txDate = new Date(tx.createdAt);
					return tx.type === "WITHDRAWAL" && txDate >= today;
				})
				.reduce((sum, tx) => sum + Number(tx.amount), 0);

			return {
				currentSpending: todayWithdrawals,
				maxDailySpending: DEFAULT_DAILY_LIMIT,
			};
		},
		retry: true,
	});
};
