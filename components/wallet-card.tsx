"use client";

import { Button } from "@/components/ui/button";
import { cn, formatBalance } from "@/lib/utils";
import { EyeClosed, Eye } from "lucide-react";
import { useState } from "react";

/** WalletCard component
contains: 
1. wallet number/id 
2. wallet balance (can be hidden for privacy)
 */
export function WalletCard({ className }: { className?: string }) {
	const balance = 20000;
	const [isHidden, setHidden] = useState(true);
	const isCollapsed = false;
	const toggleHidden = () => setHidden(!isHidden);
	const HiddenBalance = () => <h1>••••••••</h1>;

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
