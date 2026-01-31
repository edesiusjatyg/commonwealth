import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { cn } from "@/lib/utils";
import { MonthSelector } from "./month-selector";
import { TransactionEmptyState } from "./transaction-empty-state";
import { TransactionGroup } from "./transaction-group";
import { TransactionListSkeleton } from "./transaction-list-skeleton";
import { YearSelector } from "./year-selector";

interface TransactionListProps {
	currentYear: number;
	className?: string;
	year?: number;
	month?: number;
	onYearChange?: (year: number) => void;
	onMonthChange?: (month: number) => void;
}

export function TransactionList({
		currentYear,
		className,
		year: externalYear,
		month: externalMonth,
		onYearChange,
		onMonthChange,
	}: TransactionListProps) {
		const { data: wallet } = useCurrentWallet();

		const {
			isLoading,
			year: internalYear,
			setYear: setInternalYear,
			monthName,
			setMonthByName: setInternalMonthByName,
			groupedTransactions,
		} = useTransactionHistory(wallet?.id, externalYear, externalMonth);

		// Use external state if provided, otherwise use internal state
		const year = externalYear ?? internalYear;

		// Determine which setter to use
		const setYear = (newYear: number) => {
			if (onYearChange) {
				onYearChange(newYear);
			} else {
				setInternalYear(newYear);
			}
		};

		const setMonthByName = (monthStr: string) => {
			if (onMonthChange) {
				const monthNames = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December",
				];
				const monthIndex = monthNames.indexOf(monthStr);
				if (monthIndex !== -1) {
					onMonthChange(monthIndex + 1);
				}
			} else {
				setInternalMonthByName(monthStr);
			}
		};

		return (
			// FIXME: sticky issues
			<div className={cn("relative", className)}>
				<div className="relative sticky top-0 z-[5] w-full bg-background px-4">
					<div className="flex items-center justify-between bg-background py-4">
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
				{isLoading && (
					<div className="px-4">
						<TransactionListSkeleton />
					</div>
				)}

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
