"use client";

import type { RewardDTO } from "@/rpc";
import { cn, formatBalance } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

type RewardCardProps = {
	reward: RewardDTO;
	className?: string;
};

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatPeriod(start: number, end: number): string {
	return `${formatDate(start)} - ${formatDate(end)}`;
}

export function RewardCard({ reward, className }: RewardCardProps) {
	const isPending = reward.status === "pending";

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
							<TrendingUp className="size-5" />
						</div>
						<div>
							<CardTitle className="text-base">Interest Earned</CardTitle>
							<p className="text-muted-foreground text-xs">
								{formatPeriod(reward.periodStart, reward.periodEnd)}
							</p>
						</div>
					</div>
					<Badge variant={isPending ? "secondary" : "default"}>
						{isPending ? "Pending" : "Credited"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-end justify-between">
					<div>
						<p className="font-semibold text-lg text-primary">
							+{formatBalance(reward.amount)}
						</p>
						<p className="text-muted-foreground text-xs">
							{reward.interestRate}% APR
						</p>
					</div>
					{!isPending && (
						<p className="text-muted-foreground text-xs">
							Credited on {formatDate(reward.timestamp)}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
