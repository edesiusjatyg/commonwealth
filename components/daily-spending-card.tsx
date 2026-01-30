"use client";

import { useDailySpending } from "@/hooks/use-daily-spending";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { cn, formatBalance } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function DailySpendingCard() {
	const { data: wallet } = useCurrentWallet();
	const q = useDailySpending(wallet ?? undefined);


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
	const isNearlyCapped = spending >= maxDailySpending * 0.8;
	const isCapped = spending >= maxDailySpending;
	
	const fmt = (currency: number) => {
		return formatBalance(currency, {
			withoutCurrencySymbol: true,
		});
	};

	return (
		<div className="w-full space-y-4 rounded-lg p-4 shadow-sm bg-card/50 backdrop-blur-sm border border-border/50">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-sm">Daily Spending</h3>
				{isCapped ? (
					<span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Limit Reached</span>
				) : isNearlyCapped ? (
					<span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Near Limit</span>
				) : null}
			</div>
			
			<div className="flex items-baseline gap-1">
				<span className="text-xs text-muted-foreground">Rp</span>
				<span className={cn(
					"text-xl font-bold font-mono tracking-tight",
					isCapped ? "text-red-500" : isNearlyCapped ? "text-amber-500" : "text-primary"
				)}>
					{fmt(spending)}
				</span>
				<span className="text-xs text-muted-foreground font-medium">
					/ {fmt(maxDailySpending)}
				</span>
			</div>

			<div className="space-y-1.5">
				<Progress
					value={progress}
					className={cn(
						"h-2",
						isCapped && "[&>div]:bg-red-500",
						!isCapped && isNearlyCapped && "[&>div]:bg-amber-500",
						!isCapped && !isNearlyCapped && "[&>div]:bg-primary",
					)}
				/>
				{isNearlyCapped && !isCapped && (
					<p className="text-[10px] text-amber-600 font-medium leading-tight">
						You&apos;ve used {progress}% of your daily limit.
					</p>
				)}
				{isCapped && (
					<p className="text-[10px] text-red-600 font-medium leading-tight">
						Daily limit reached. Further transactions require approval.
					</p>
				)}
			</div>
		</div>
	);
}
