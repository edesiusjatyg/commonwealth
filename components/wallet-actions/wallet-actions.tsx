"use client";

import { cn } from "@/lib/utils";
import {
	BanknoteArrowDown,
	BanknoteArrowUp,
	CreditCard,
	Gift,
	LucideIcon,
} from "lucide-react";
import { MouseEventHandler } from "react";
import { RecentTransferredAccounts } from "./recent-transferred-accounts";

function WalletActionItem({
	icon: Icon,
	label,
	onClick,
}: {
	icon?: LucideIcon;
	label?: string;
	onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
	return (
		<button
			type="button"
			className="flex min-w-10 flex-col rounded-sm border-1 border-primary p-2 text-primary shadow-sm transition hover:bg-primary hover:text-background md:p-6"
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
	const actions = [
		{
			icon: CreditCard,
			label: "Transfer",
			onClick: () => {},
		},
		{
			icon: BanknoteArrowUp,
			label: "Deposit",
		},
		{
			icon: BanknoteArrowDown,
			label: "Withdraw",
		},
		{
			icon: Gift,
			label: "Rewards",
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
						// biome-ignore lint/suspicious/noArrayIndexKey: stable index
						key={idx}
					/>
				))}
			</div>
		</section>
	);
}
