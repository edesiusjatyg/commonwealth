"use server";

import { prisma } from "@/lib/prisma";
import { BalanceResponse, TransactionRecord } from "@/types";
import { Transaction } from "@prisma/client";

import { z } from "zod";

// Input schema
const getExpensesSchema = z.object({
	walletId: z.string().min(1, "Wallet ID is required"),
});

// Input type
export type GetExpensesInput = z.infer<typeof getExpensesSchema>;

/**
 * Get expenses/balance for a wallet
 */
export async function getExpenses(
	input: GetExpensesInput,
): Promise<BalanceResponse> {
	try {
		const validatedData = getExpensesSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: validatedData.error.issues[0].message,
				balance: 0,
				history: [],
				totalDeposits: 0,
				totalWithdrawals: 0,
			};
		}

		const { walletId } = validatedData.data;

		const transactions: Transaction[] = await prisma.transaction.findMany({
			where: { walletId },
			orderBy: { createdAt: "desc" },
		});


		const totalDeposits = transactions
			.filter((t) => t.type === "DEPOSIT" || t.type === "YIELD")
			.reduce((sum, t) => sum + Number(t.amount), 0);
		const totalWithdrawals = transactions
			.filter((t) => t.type === "WITHDRAWAL")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const history: TransactionRecord[] = transactions.map((t) => ({
			id: t.id,
			walletId: t.walletId,
			type: t.type,
			amount: Number(t.amount),
			category: t.category,
			description: t.description,
			createdAt: t.createdAt,
		}));

		return {
			balance: totalDeposits - totalWithdrawals,
			history,
			totalDeposits,
			totalWithdrawals,
		};
	} catch (error: any) {
		console.error("Expenses error:", error);
		return {
			error: "Internal server error",
			balance: 0,
			history: [],
			totalDeposits: 0,
			totalWithdrawals: 0,
		};
	}
}
