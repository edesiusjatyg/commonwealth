"use client";

import { useDailySpending } from "@/hooks/use-daily-spending";
import { cn, formatBalance } from "@/lib/utils";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";

export function DailySpendingCard() {
	const q = useDailySpending();

	if (q.isLoading)
		return (
			<div className="w-full space-y-4 rounded-lg p-4 shadow-sm">
				<h3>Daily Spending</h3>
				<Skeleton className="h-2 w-full rounded-full" />
			</div>
		);
	if (q.isError || !q.data)
		return (
			<div className="w-full space-y-4 rounded-lg p-4 shadow-sm">
				<h3>Daily Spending</h3>
				<Skeleton className="h-2 w-full rounded-full" />
			</div>
		);

	const maxDailySpending = q.data.maxDailySpending;
	const spending = q.data.currentSpending;
	const progress = Math.min(
		Math.round((spending / maxDailySpending) * 100),
		100,
	);
	const isCapped = spending >= maxDailySpending;
	const fmt = (currency: number) => {
		return formatBalance(currency, {
			withoutCurrencySymbol: true,
		});
	};

	return (
		<div className="w-full space-y-4 rounded-lg p-4 shadow-sm">
			<h3>Daily Spending</h3>
			{
				<p>
					Rp <span className="text-primary">{fmt(spending)}</span> /
					{` ${fmt(maxDailySpending)}`}
				</p>
			}
			<Progress
				value={progress}
				className={cn(
					isCapped && "[&>div]:bg-red-500",
					!isCapped && "[&>div]:bg-primary",
				)}
			/>
		</div>
	);
}
