import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { MonthSelector } from "./month-selector";
import { TransactionEmptyState } from "./transaction-empty-state";
import { TransactionGroup } from "./transaction-group";
import { TransactionListSkeleton } from "./transaction-list-skeleton";
import { YearSelector } from "./year-selector";
import { cn } from "@/lib/utils";

interface TransactionListProps {
	currentYear: number;
	className?: string;
}

export function TransactionList({
	currentYear,
	className,
}: TransactionListProps) {
	const { data: wallet } = useCurrentWallet();
	
	const {
		isLoading,
		year,
		setYear,
		monthName,
		setMonthByName,
		groupedTransactions,
	} = useTransactionHistory(wallet?.id);


	return (
		// FIXME: sticky issues
		<div className={cn("relative", className)}>
			<div className="sticky top-0 w-full bg-background relative px-4 z-[5]">
				<div className="py-4 flex items-center justify-between bg-background">
					<h2 className="font-semibold text-lg">Transaksi</h2>
					<YearSelector
						setYear={setYear}
						yearValue={year}
						currentYear={currentYear}
					/>
				</div>
				<MonthSelector monthName={monthName} onSelect={setMonthByName} />
			</div>

			{/* Loading State */}
			{isLoading && <div className="px-4">
            <TransactionListSkeleton />
         </div>}

			{/* Empty State */}
			{!isLoading && groupedTransactions.length === 0 && (
				<div className="px-4">
               <TransactionEmptyState monthName={monthName} />
            </div>
			)}

			{/* Transaction Groups */}
			{!isLoading && groupedTransactions.length > 0 && (
				<div className="space-y-6 px-4">
					{groupedTransactions.map((group) => (
						<TransactionGroup key={group.date} {...group} />
					))}
				</div>
			)}
		</div>
	);
}
