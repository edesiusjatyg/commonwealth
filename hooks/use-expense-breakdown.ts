import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransactionHistory } from "@/rpc";
import {
	categoryColorMap,
	defaultCategoryColor,
} from "@/components/financial/constants";
import type { TransactionRecord } from "@/types";

export interface ExpenseBreakdownItem {
	category: string;
	amount: number;
	percentage: number;
	color: string;
	transactionCount: number;
}

export interface ExpenseBreakdown {
	data: ExpenseBreakdownItem[];
	totalExpense: number;
	hasExpenses: boolean;
}

/**
 * Hook to get expense breakdown by category for a specific month/year
 * Uses the same query key as useTransactionHistory to leverage cached data
 */
export function useExpenseBreakdown(
	walletId?: string,
	year?: number,
	month?: number,
) {
	// Calculate date range for the selected month
	const monthIndex = month ? month - 1 : new Date().getMonth();
	const selectedYear = year || new Date().getFullYear();

	const start = new Date(selectedYear, monthIndex, 1).toISOString();
	const end = new Date(
		selectedYear,
		monthIndex + 1,
		0,
		23,
		59,
		59,
		999,
	).toISOString();

	// Fetch transaction history (will use cached data if already fetched by useTransactionHistory)
	const query = useQuery({
		queryKey: ["transaction-history", walletId, selectedYear, month],
		queryFn: () =>
			getTransactionHistory({ walletId: walletId || "", start, end }),
		enabled: !!walletId,
	});

	// Calculate expense breakdown from transactions
	const breakdown = useMemo<ExpenseBreakdown>(() => {
		const transactions = query.data?.transactions || [];

		// Filter only expenses (WITHDRAWAL type)
		const expenses = transactions.filter(
			(t: TransactionRecord) => t.type === "WITHDRAWAL",
		);

		if (expenses.length === 0) {
			return {
				data: [],
				totalExpense: 0,
				hasExpenses: false,
			};
		}

		// Group by category and sum amounts
		const categoryMap = new Map<string, { amount: number; count: number }>();

		expenses.forEach((tx: TransactionRecord) => {
			const category = tx.category || "Others";
			const existing = categoryMap.get(category);

			if (existing) {
				existing.amount += Number(tx.amount);
				existing.count += 1;
			} else {
				categoryMap.set(category, {
					amount: Number(tx.amount),
					count: 1,
				});
			}
		});

		// Calculate total expense
		const totalExpense = Array.from(categoryMap.values()).reduce(
			(sum, item) => sum + item.amount,
			0,
		);

		// Convert to array with percentages
		const data: ExpenseBreakdownItem[] = Array.from(categoryMap.entries()).map(
			([category, { amount, count }]) => {
				const color = categoryColorMap[category] || defaultCategoryColor;

				return {
					category,
					amount,
					percentage: (amount / totalExpense) * 100,
					color,
					transactionCount: count,
				};
			},
		);

		// Sort by amount descending
		data.sort((a, b) => b.amount - a.amount);

		return {
			data,
			totalExpense,
			hasExpenses: true,
		};
	}, [query.data?.transactions]);

	return {
		breakdown,
		isLoading: query.isLoading,
		error: query.error,
	};
}
