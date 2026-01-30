/**
 * Database utilities for The Oracle AI feature
 * Read-only access to Neon DB for fetching user context
 */

import { prisma } from "./prisma";

export type OracleContext = {
	userId: string;
	walletAddress: string | null;
	walletName: string | null;
	totalBalance: number;
	recentTransactions: {
		type: string;
		amount: number;
		category: string | null;
		description: string | null;
		createdAt: Date;
	}[];
	transactionSummary: {
		totalDeposits: number;
		totalWithdrawals: number;
		totalYield: number;
		transactionCount: number;
	};
};

/**
 * Fetch context for The Oracle from Neon DB (read-only)
 * 
 * @param userId - The user ID to fetch context for
 * @returns Oracle context with wallet and transaction data
 */
export async function getOracleContext(userId: string): Promise<OracleContext | null> {
	try {
		// Fetch user's wallet with recent transactions (read-only)
		const wallet = await prisma.wallet.findFirst({
			where: { userId },
			include: {
				transactions: {
					orderBy: { createdAt: "desc" },
					take: 20, // Last 20 transactions for context
				},
			},
		});

		if (!wallet) {
			return null;
		}

		// Calculate transaction summary
		const summary = wallet.transactions.reduce(
			(acc, tx) => {
				const amount = Number(tx.amount);
				switch (tx.type) {
					case "DEPOSIT":
						acc.totalDeposits += amount;
						break;
					case "WITHDRAWAL":
						acc.totalWithdrawals += amount;
						break;
					case "YIELD":
						acc.totalYield += amount;
						break;
				}
				acc.transactionCount++;
				return acc;
			},
			{ totalDeposits: 0, totalWithdrawals: 0, totalYield: 0, transactionCount: 0 }
		);

		// Calculate current balance (deposits + yield - withdrawals)
		const totalBalance = summary.totalDeposits + summary.totalYield - summary.totalWithdrawals;

		return {
			userId,
			walletAddress: wallet.address,
			walletName: wallet.name,
			totalBalance,
			recentTransactions: wallet.transactions.map((tx) => ({
				type: tx.type,
				amount: Number(tx.amount),
				category: tx.category,
				description: tx.description,
				createdAt: tx.createdAt,
			})),
			transactionSummary: summary,
		};
	} catch (error) {
		console.error("Error fetching Oracle context from Neon DB:", error);
		return null;
	}
}

/**
 * Format Oracle context into a prompt-friendly string
 */
export function formatOracleContextForPrompt(context: OracleContext): string {
	const { walletName, totalBalance, transactionSummary, recentTransactions } = context;

	const recentTxSummary = recentTransactions.slice(0, 5).map((tx) => {
		const sign = tx.type === "WITHDRAWAL" ? "-" : "+";
		return `  ${sign}$${tx.amount.toLocaleString()} (${tx.category || tx.type})`;
	}).join("\n");

	return `
Wallet: ${walletName || "Primary Wallet"}
Current Balance: $${totalBalance.toLocaleString()}

Transaction Summary:
- Total Deposits: $${transactionSummary.totalDeposits.toLocaleString()}
- Total Withdrawals: $${transactionSummary.totalWithdrawals.toLocaleString()}
- Yield Earned: $${transactionSummary.totalYield.toLocaleString()}
- Total Transactions: ${transactionSummary.transactionCount}

Recent Activity:
${recentTxSummary || "  No recent transactions"}
`.trim();
}
