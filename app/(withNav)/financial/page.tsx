"use client";

import { useState } from "react";
import { BudgetChart, TransactionList } from "@/components/financial";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useExpenseBreakdown } from "@/hooks/use-expense-breakdown";

export default function FinancialPage() {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1; // 1-12

	// Lift state to parent to sync BudgetChart and TransactionList
	const [year, setYear] = useState<number>(currentYear);
	const [month, setMonth] = useState<number>(currentMonth);

	// Get current wallet
	const { data: wallet } = useCurrentWallet();

	// Get expense breakdown for the selected month
	const { breakdown, isLoading } = useExpenseBreakdown(wallet?.id, year, month);

	return (
		<div className="flex flex-col gap-6 pb-20">
			<BudgetChart
				data={breakdown?.data || []}
				totalExpense={breakdown?.totalExpense || 0}
				isLoading={isLoading}
				isEmpty={!breakdown?.hasExpenses}
			/>
			<div className="relative">
				<TransactionList
					currentYear={currentYear}
					year={year}
					month={month}
					onYearChange={setYear}
					onMonthChange={setMonth}
					className="rounded-tl-lg rounded-tr-lg bg-background py-4 shadow-[0_-4px_8px_rgba(0,0,0,0.08)]"
				/>
			</div>
		</div>
	);
}
