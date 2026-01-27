"use client";

import {
	BudgetChart,
	DEFAULT_TOTAL_BUDGET,
	TransactionList,
} from "@/components/financial";

export default function FinancialPage() {
	const currentYear = new Date().getFullYear();

	return (
		<div className="flex flex-col gap-6 pb-20">
			<BudgetChart totalBudget={DEFAULT_TOTAL_BUDGET} />
			<div className="relative ">
				{/* <div className="relative "> */}
				<TransactionList
					currentYear={currentYear}
					className="bg-background shadow-[0_-4px_8px_rgba(0,0,0,0.08)] rounded-tr-lg rounded-tl-lg py-4"
				/>
			</div>
		</div>
	);
}

/*
so i want this page to have 2 possible display state:
1. Overview State: shows budget chart and transaction list (current implementation)
2. Detailed State: shows only transaction list with more filters and options

By default, the page loads in Overview State. Users can toggle to Detailed State via a button or link.

In Detailed State:
- Add filters for date range, categories, amount range
- Option to export transactions
- More detailed transaction info (e.g., notes, tags)

Need to implement state management to handle the toggle between states and conditionally render components based on the current state.
*/
