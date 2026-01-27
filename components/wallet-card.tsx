"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { cn, formatBalance } from "@/lib/utils";
import { EyeClosed, Eye } from "lucide-react";
import { useState } from "react";

// TODO: Replace with actual wallet ID from user context when available
const MOCK_WALLET_ID = "mock-wallet-id";

/** WalletCard component
contains: 
1. wallet number/id 
2. wallet balance (can be hidden for privacy)
 */
export function WalletCard({ className }: { className?: string }) {
	const { data, isLoading, isError, error } = useWalletBalance(MOCK_WALLET_ID);
	const [isHidden, setHidden] = useState(true);
	const isCollapsed = false;
	const toggleHidden = () => setHidden(!isHidden);
	const HiddenBalance = () => <h1>••••••••</h1>;

	// Loading state
	if (isLoading) {
		return (
			<div
				className={cn(
					"flex w-full flex-col gap-2 rounded-lg border-2 border-muted/20 bg-background/50 p-6 shadow-sm backdrop-blur-lg",
					className,
				)}
			>
				{!isCollapsed && <p>Main Wallet Balance</p>}
				<Skeleton className="h-8 w-32" />
			</div>
		);
	}


   if (isError && error) {
      console.error("wallet-card: ", error)
   }
	// Error state - show fallback balance of 0
	const balance = isError || !data ? 0 : data.balance;

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-2 rounded-lg border-2 border-muted/20 bg-background/50 p-6 shadow-sm backdrop-blur-lg",
				className,
			)}
		>
			{!isCollapsed && <p>Main Wallet Balance</p>}
			<div className="flex w-40 items-center justify-between">
				{isHidden ? <HiddenBalance /> : <h1>{formatBalance(balance)}</h1>}
				<Button variant={"ghost"} size="icon" onClick={toggleHidden}>
					{isHidden ? <EyeClosed /> : <Eye />}
				</Button>
			</div>
		</div>
	);
}
