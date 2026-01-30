"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";

const DEFAULT_DAILY_LIMIT = 2000000;

export type DailySpendingData = {
	currentSpending: number;
	maxDailySpending: number;
};

export const useDailySpending = (wallet: { id: string; dailyLimit: number; spendingToday: number } | undefined) => {
	return useQuery({
		queryKey: queryKeys.wallet.dailySpending(wallet?.id || ""),
		queryFn: async (): Promise<DailySpendingData> => {
			if (!wallet) {
				return { currentSpending: 0, maxDailySpending: DEFAULT_DAILY_LIMIT };
			}
			
			// We can trust the wallet object's spendingToday if it was just fetched
			// or we can calculate it from balance history for accuracy
			const response = await rpc.getWalletBalance(wallet.id);

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
				maxDailySpending: wallet.dailyLimit > 0 ? wallet.dailyLimit : DEFAULT_DAILY_LIMIT,
			};
		},
		retry: true,
		enabled: !!wallet?.id,
	});
};
