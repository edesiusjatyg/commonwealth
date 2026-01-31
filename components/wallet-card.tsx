"use client";

import {
	ChevronDown,
	ChevronUp,
	Eye,
	EyeClosed,
	Lock,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useDailySpending } from "@/hooks/use-daily-spending";
import { useRequestApproval } from "@/hooks/use-request-approval";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { cn, formatBalance } from "@/lib/utils";

export function WalletCard({ className }: { className?: string }) {
	const { data: wallet } = useCurrentWallet();
	const { data, isLoading, isError, error } = useWalletBalance(
		wallet?.id || "",
	);
	const dailySpending = useDailySpending(wallet ?? undefined);
	const requestApproval = useRequestApproval(wallet?.id || "");

	const [isHidden, setHidden] = useState(true);
	const [showDetails, setShowDetails] = useState(false);
	const toggleHidden = () => setHidden(!isHidden);
	const HiddenBalance = () => (
		<span className="font-mono text-2xl tracking-wider">••••••••</span>
	);

	// Loading state
	if (isLoading) {
		return (
			<div
				className={cn(
					"flex w-full flex-col gap-3 rounded-lg border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm",
					className,
				)}
			>
				<Skeleton className="h-5 w-24" />
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-2 w-full" />
			</div>
		);
	}

	if (isError && error) {
		console.error("wallet-card: ", error);
	}

	// Error state - show fallback balance of 0
	const balance = isError || !data ? 0 : data.balance;
	const totalDeposits = isError || !data ? 0 : data.totalDeposits;
	const totalWithdrawals = isError || !data ? 0 : data.totalWithdrawals;

	// Calculate 24h change (deposits - withdrawals)
	const change24h = totalDeposits - totalWithdrawals;
	const isPositiveChange = change24h >= 0;

	// Spending limit calculations
	const currentSpending = dailySpending.data?.currentSpending || 0;
	const maxDailySpending = dailySpending.data?.maxDailySpending || 0;
	const spendingProgress =
		maxDailySpending > 0
			? Math.min((currentSpending / maxDailySpending) * 100, 100)
			: 0;
	const isNearLimit = currentSpending >= maxDailySpending * 0.8;
	const isLocked = currentSpending >= maxDailySpending;
	// const isLocked = true;

	const handleRequestApproval = () => {
		requestApproval.mutate();
	};

	return (
		<div
			className={cn(
				"group flex w-full flex-col gap-3 rounded-lg border border-border bg-card/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md",
				className,
			)}
		>
			{/* Lock Status - Always visible when locked */}
			{isLocked && (
				<div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
					<Lock className="h-3.5 w-3.5 text-muted-foreground" />
					<div className="flex-1">
						<p className="text-xs font-medium">Wallet locked</p>
						<p className="text-[10px] text-muted-foreground leading-tight">
							Daily spending limit reached
						</p>
					</div>
				</div>
			)}

			{/* Balance Display */}
			<div className="flex items-start justify-between">
				<div className="flex-1 space-y-1">
					<div className="flex items-center gap-2">
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							Balance
						</span>
					</div>
					{isHidden ? (
						<HiddenBalance />
					) : (
						<>
							<div className="font-mono font-semibold text-2xl tracking-tight">
								{formatBalance(balance)}
							</div>
							{/* 24h Change Indicator - Subtle */}
							{change24h !== 0 && (
								<div className="flex items-center gap-1.5 text-xs">
									{isPositiveChange ? (
										<TrendingUp className="h-3.5 w-3.5 text-chart-1" />
									) : (
										<TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
									)}
									<span
										className={cn(
											"font-medium",
											isPositiveChange
												? "text-chart-1"
												: "text-muted-foreground",
										)}
									>
										{isPositiveChange ? "+" : ""}
										{formatBalance(change24h, { withoutCurrencySymbol: true })}
									</span>
									<span className="text-muted-foreground">today</span>
								</div>
							)}
						</>
					)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleHidden}
					className="h-8 w-8 text-muted-foreground hover:text-foreground"
				>
					{isHidden ? (
						<EyeClosed className="h-4 w-4" />
					) : (
						<Eye className="h-4 w-4" />
					)}
				</Button>
			</div>

			{/* Request Approval Button - Always visible when locked */}
			{isLocked && (
				<Button
					onClick={handleRequestApproval}
					disabled={requestApproval.isPending}
					variant="outline"
					className="w-full gap-2 text-xs"
					size="sm"
				>
					<Lock className="h-3.5 w-3.5" />
					{requestApproval.isPending
						? "Sending request..."
						: "Request approval"}
				</Button>
			)}

			{/* Spending Limit Indicator - Only shown when balance visible */}
			{!isHidden && maxDailySpending > 0 && (
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs">
							Daily spending
						</span>
						<span className="font-medium font-mono text-xs">
							{formatBalance(currentSpending, { withoutCurrencySymbol: true })}{" "}
							/{" "}
							{formatBalance(maxDailySpending, { withoutCurrencySymbol: true })}
						</span>
					</div>
					<Progress
						value={spendingProgress}
						className={cn(
							"h-1",
							isLocked && "[&>div]:bg-muted-foreground",
							!isLocked && isNearLimit && "[&>div]:bg-accent-foreground",
							!isLocked && !isNearLimit && "[&>div]:bg-primary",
						)}
					/>
				</div>
			)}

			{/* Balance Breakdown Toggle */}
			{!isHidden && (
				<button
					type="button"
					onClick={() => setShowDetails(!showDetails)}
					className="flex items-center justify-between border-border border-t pt-3 text-muted-foreground text-xs transition-colors hover:text-foreground"
				>
					<span>Transaction breakdown</span>
					{showDetails ? (
						<ChevronUp className="h-3.5 w-3.5" />
					) : (
						<ChevronDown className="h-3.5 w-3.5" />
					)}
				</button>
			)}

			{/* Balance Breakdown */}
			{showDetails && !isHidden && (
				<div className="space-y-2 text-xs">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Deposits</span>
						<span className="font-mono text-chart-1">
							+{formatBalance(totalDeposits, { withoutCurrencySymbol: true })}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Withdrawals</span>
						<span className="font-mono text-muted-foreground">
							-
							{formatBalance(totalWithdrawals, { withoutCurrencySymbol: true })}
						</span>
					</div>
					<div className="flex items-center justify-between border-border border-t pt-2 font-medium">
						<span>Net balance</span>
						<span className="font-mono">
							{formatBalance(balance, { withoutCurrencySymbol: true })}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
