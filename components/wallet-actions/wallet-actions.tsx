"use client";

import { cn } from "@/lib/utils";
import {
	BanknoteArrowDown,
	BanknoteArrowUp,
	CreditCard,
	Gift,
	type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { MouseEventHandler } from "react";
import { RecentTransferredAccounts } from "./recent-transferred-accounts";

import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useDailySpending } from "@/hooks/use-daily-spending";

function WalletActionItem({
	icon: Icon,
	label,
	onClick,
	disabled,
}: {
	icon?: LucideIcon;
	label?: string;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			className={cn(
				"flex min-w-10 flex-col rounded-sm border-1 border-primary p-2 text-primary shadow-sm transition md:p-6",
				disabled 
					? "opacity-50 cursor-not-allowed border-muted text-muted" 
					: "hover:bg-primary hover:text-background"
			)}
			onClick={onClick}
		>
			{Icon && <Icon className="mx-auto md:size-8" />}
			<p className="text-xs md:text-sm">{label}</p>
		</button>
	);
}

/**
WalletActions component
contains:
1. Transfer button 
2. Deposit button
3. Withdraw button
4. Reward button ? 
*/
export function WalletActions({ className }: { className?: string }) {
	const router = useRouter();
	const { data: wallet } = useCurrentWallet();
	const { data: spendingData } = useDailySpending(wallet ?? undefined);
	
	const isLimitReached = spendingData ? spendingData.currentSpending >= spendingData.maxDailySpending : false;

	const actions = [
		{
			icon: CreditCard,
			label: "Transfer",
			onClick: () => router.push("/actions/transfer"),
			disabled: isLimitReached,
		},
		{
			icon: BanknoteArrowDown,
			label: "Withdraw",
			onClick: () => router.push("/actions/withdraw"),
			disabled: isLimitReached,
		},
		{
			icon: BanknoteArrowUp,
			label: "Deposit",
			onClick: () => router.push("/actions/deposit"),
			disabled: false,
		},
		{
			icon: Gift,
			label: "Rewards",
			onClick: () => router.push("/actions/rewards"),
			disabled: false,
		},
	];

	return (
		<section
			className={cn(
				"flex w-full flex-col items-center gap-6 rounded-lg p-4 shadow-sm",
				className,
			)}
		>
			<RecentTransferredAccounts />
			<div className="flex w-full items-center justify-center gap-4">
				{actions.map((action, idx) => (
					<WalletActionItem
						icon={action.icon}
						label={action.label}
						onClick={action?.onClick}
						disabled={action.disabled}
						// biome-ignore lint/suspicious/noArrayIndexKey: stable index
						key={idx}
					/>
				))}
			</div>
			{isLimitReached && (
				<p className="text-[10px] text-destructive font-bold uppercase tracking-widest animate-pulse">
					Daily Limit Reached - Transfers & Withdrawals Locked
				</p>
			)}
		</section>
	);
}
