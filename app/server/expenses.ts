"use server";

import { prisma } from "@/lib/prisma";
import { BalanceResponse, TransactionRecord } from "@/types";

import { z } from "zod";

// Input schema
const getExpensesSchema = z.object({
	walletId: z.string().min(1, "Wallet ID is required"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

// Input type
export type GetExpensesInput = z.infer<typeof getExpensesSchema>;

/**
 * Get expenses/balance for a wallet
 */
export async function getExpenses(
	input: GetExpensesInput,
): Promise<BalanceResponse> {
	console.info("[expenses.getExpenses] Fetching expenses", { 
		walletId: input.walletId,
		hasDateFilter: !!(input.startDate || input.endDate)
	});
	
	try {
		const validatedData = getExpensesSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[expenses.getExpenses] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				balance: 0,
				history: [],
				totalDeposits: 0,
				totalWithdrawals: 0,
			};
		}

		const { walletId, startDate, endDate } = validatedData.data;

		// Build where clause for all transactions (to calculate totals/balance correctly)
		const whereClause: any = { walletId };
		
		// Build where clause for history (if dates provided)
		const historyWhereClause: any = { walletId };
		if (startDate || endDate) {
			historyWhereClause.createdAt = {};
			if (startDate) historyWhereClause.createdAt.gte = new Date(startDate);
			if (endDate) historyWhereClause.createdAt.lte = new Date(endDate);
			console.info("[expenses.getExpenses] Applying date filter", { startDate, endDate });
		}

		// Fetch filtered history
		console.info("[expenses.getExpenses] Fetching filtered transactions");
		const transactions = await prisma.transaction.findMany({
			where: historyWhereClause,
			orderBy: { createdAt: "desc" },
		});

		// Fetch all transactions for totals and balance calculation
		console.info("[expenses.getExpenses] Fetching all transactions for balance calculation");
		const allTransactions = await prisma.transaction.findMany({
			where: { walletId },
		});

		type TransactionType = (typeof allTransactions)[number];

		const totalDeposits = allTransactions
			.filter((t: TransactionType) => t.type === "DEPOSIT" || t.type === "YIELD")
			.reduce((sum, t: TransactionType) => sum + Number(t.amount), 0);
		const totalWithdrawals = allTransactions
			.filter((t: TransactionType) => t.type === "WITHDRAWAL")
			.reduce((sum, t: TransactionType) => sum + Number(t.amount), 0);

		const history: TransactionRecord[] = transactions.map((t) => ({
			id: t.id,
			walletId: t.walletId,
			type: t.type,
			amount: Number(t.amount),
			category: t.category,
			description: t.description,
			createdAt: t.createdAt,
		}));

		const balance = totalDeposits - totalWithdrawals;
		console.info("[expenses.getExpenses] Expenses fetched successfully", { 
			walletId,
			balance,
			transactionCount: history.length,
			totalDeposits,
			totalWithdrawals
		});

		return {
			balance,
			history,
			totalDeposits,
			totalWithdrawals,
		};
	} catch (error: unknown) {
		console.error("[expenses.getExpenses] Expenses error:", error);
		return {
			error: "Internal server error",
			balance: 0,
			history: [],
			totalDeposits: 0,
			totalWithdrawals: 0,
		};
	}
}
