import { bankAccountSchema, Result } from "@/types";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { useDailySpending } from "./use-daily-spending";
import { useCurrentWallet } from "./use-current-wallet";

// TODO: Replace with actual wallet ID from user context
const MOCK_WALLET_ID = "mock-wallet-id";

const supportedBanks = [
	"BCA (Bank Central Asia)",
	"BNI (Bank Negara Indonesia)",
	"BRI (Bank Rakyat Indonesia)",
	"Mandiri",
	"CIMB Niaga",
	"Permata Bank",
	"Danamon",
] as const;

const withdrawFormSchema = z.object({
	bank: z.enum(supportedBanks, "Bank is not supported"),
	accountNumber: bankAccountSchema,
	amount: z.number().min(10, "Minimum withdraw amount is 10 USDT"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type WithdrawFormData = z.infer<typeof withdrawFormSchema>;
type WithdrawError = {
	code: "INSUFFICIENT_FUNDS" | "INVALID_ACCOUNT" | "SERVER_ERROR" | "DAILY_LIMIT";
	message: string;
};

type WithdrawResult = Result<number, WithdrawError>;

// Maps server action error to typed error
const mapServerError = (error: string): WithdrawError => {
	if (error.includes("Insufficient")) {
		return { code: "INSUFFICIENT_FUNDS", message: error };
	}
	if (error.includes("Daily limit")) {
		return { code: "DAILY_LIMIT", message: error };
	}
	return { code: "SERVER_ERROR", message: error };
};

export const useWithdrawForm = (walletId: string | undefined) => {
	const [isPending, startTransition] = useTransition();
	const queryClient = useQueryClient();

	// Wallet & Spending hooks
	const { data: wallet } = useCurrentWallet();
	const { data: spendingData } = useDailySpending(wallet ?? undefined);

	const form = useForm<WithdrawFormData>({
		defaultValues: {
			bank: supportedBanks[0],
			accountNumber: "",
			amount: 10,
			password: "",
		},
		resolver: zodResolver(withdrawFormSchema),
	});

	// Watch amount reactively
	const amount = useWatch({
		control: form.control,
		name: "amount",
		defaultValue: 10,
	});

	// Daily Limit Validation
	const dailyLimitStatus = (() => {
		if (!spendingData) return { isOverLimit: false, isNearLimit: false, remaining: 0, maxDailySpending: 0 };
		
		const { currentSpending, maxDailySpending } = spendingData;
		const potentialTotal = currentSpending + amount;
		const remaining = Math.max(0, maxDailySpending - currentSpending);
		
		return {
			isOverLimit: potentialTotal > maxDailySpending,
			isNearLimit: potentialTotal >= maxDailySpending * 0.8 && potentialTotal <= maxDailySpending,
			remaining,
			maxDailySpending,
		};
	})();

	const handleError = (error: WithdrawError) => {
		switch (error.code) {
			case "INSUFFICIENT_FUNDS":
				toast.error("Insufficient funds", {
					description: "Please check your balance and try again.",
				});
				form.setError("amount", { message: error.message });
				break;
			case "DAILY_LIMIT":
				toast.error("Daily limit exceeded", {
					description: error.message,
				});
				form.setError("amount", { message: error.message });
				break;
			case "INVALID_ACCOUNT":
				form.setError("accountNumber", { message: error.message });
				break;
			case "SERVER_ERROR":
				form.setError("root", { message: error.message });
				toast.error(error.message);
				break;
		}
	};

	const withdrawAction = (e: React.FormEvent) => {
		e.preventDefault();
		startTransition(() => {
			form.handleSubmit(async (data) => {
				// Call RPC which calls server action
				const response = await rpc.withdrawFunds({
					walletId: walletId || "",
					amount: data.amount,
					category: data.bank,
					password: data.password,
					description: `Withdrawal to ${data.accountNumber}`,
				});

				if (response.error) {
					handleError(mapServerError(response.error));
					return;
				}

				// Success - invalidate wallet queries to refresh balance
				queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
				
				toast.success("Withdrawal successful", {
					description: response.message,
				});
				
				form.reset();
			})();
		});
	};

	return {
		form,
		isPending,
		withdrawAction,
		dailyLimitStatus,
	};
};
