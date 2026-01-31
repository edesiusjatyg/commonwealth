import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTransactionHistory } from "@/rpc";
import type { TransactionRecord } from "@/types";

// Generate month names array (0-11 for JavaScript Date months)
const MONTH_INDICES = Array.from({ length: 12 }, (_, i) => i);
export const MONTH_NAMES = MONTH_INDICES.map((monthIndex) =>
	new Date(0, monthIndex).toLocaleString("en-US", { month: "long" }),
);

function groupTransactionsByDate(transactions: TransactionRecord[]) {
	const groups = new Map<string, TransactionRecord[]>();

	transactions.forEach((tx) => {
		const date = new Date(tx.createdAt);
		const dateKey = date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			weekday: "long",
		});

		if (!groups.has(dateKey)) {
			groups.set(dateKey, []);
		}
		const group = groups.get(dateKey);
		if (group) {
			group.push(tx);
		}
	});

	// Convert to array and sort by date descending
	return Array.from(groups.entries())
		.map(([date, txs]) => ({
			date,
			transactions: txs.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
			income: txs
				.filter((tx) => tx.type === "DEPOSIT" || tx.type === "YIELD")
				.reduce((sum, tx) => sum + Number(tx.amount), 0),
			expenses: txs
				.filter((tx) => tx.type === "WITHDRAWAL")
				.reduce((sum, tx) => sum + Number(tx.amount), 0),
		}))
		.sort((a, b) => {
			const dateA = new Date(a.transactions[0].createdAt);
			const dateB = new Date(b.transactions[0].createdAt);
			return dateB.getTime() - dateA.getTime();
		});
}

export function useTransactionHistory(
	walletId?: string,
	externalYear?: number,
	externalMonth?: number,
) {
	const currentDate = new Date();
	const [internalYear, setInternalYear] = useState<number>(
		currentDate.getFullYear(),
	);
	const [internalMonth, setInternalMonth] = useState<number>(
		currentDate.getMonth() + 1,
	); // 1-12

	// Use external state if provided, otherwise use internal state
	const year = externalYear ?? internalYear;
	const month = externalMonth ?? internalMonth;

	// Derived values
	const monthIndex = month - 1; // 0-11 for array indexing
	const monthName = MONTH_NAMES[monthIndex];

	// Calculate date range for the selected month
	const start = new Date(year, monthIndex, 1).toISOString();
	const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

	// Fetch transaction history
	const query = useQuery({
		queryKey: ["transaction-history", walletId, year, month],
		queryFn: () =>
			getTransactionHistory({ walletId: walletId || "", start, end }),
		enabled: !!walletId,
	});

	// Helper to set month by name
	const setMonthByName = (monthStr: string) => {
		const index = MONTH_NAMES.indexOf(monthStr);
		if (index !== -1) {
			setInternalMonth(index + 1);
		}
	};

	return {
		// Query state
		data: query.data?.transactions,
		isLoading: query.isLoading,
		error: query.error,

		// Grouped transactions
		groupedTransactions: groupTransactionsByDate(
			query.data?.transactions || [],
		),

		// Date selection
		year,
		month,
		monthName,
		setYear: setInternalYear,
		setMonth: setInternalMonth,
		setMonthByName,

		// Date range
		dateRange: { start, end },
	};
}
