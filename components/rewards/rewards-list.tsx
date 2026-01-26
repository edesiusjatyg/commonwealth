"use client";

import { useRewards } from "@/hooks/use-rewards";
import { RewardCard } from "./reward-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "@/components/ui/empty";
import { Gift } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function RewardsListSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			{[1, 2, 3].map((i) => (
				<div key={i} className="rounded-xl border p-6 shadow-sm">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="size-10 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
						<Skeleton className="h-5 w-16 rounded-full" />
					</div>
					<div className="mt-4 space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-6 w-28" />
					</div>
				</div>
			))}
		</div>
	);
}

function RewardsEmptyState() {
	return (
		<Empty className="py-12">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Gift />
				</EmptyMedia>
				<EmptyTitle>No interest earned yet</EmptyTitle>
				<EmptyDescription>
					Keep a balance in your wallet to start earning interest on your funds!
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

function RewardsErrorState({ message }: { message: string }) {
	return (
		<Alert variant="destructive">
			<AlertCircle className="size-4" />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	);
}

export function RewardsList() {
	const { data: rewards, isLoading, isError, error } = useRewards();

	if (isLoading) {
		return <RewardsListSkeleton />;
	}

	if (isError) {
		return (
			<RewardsErrorState
				message={error?.message || "Failed to load rewards"}
			/>
		);
	}

	if (!rewards || rewards.length === 0) {
		return <RewardsEmptyState />;
	}

	return (
		<div className="flex flex-col gap-4">
			{rewards.map((reward) => (
				<RewardCard key={reward.id} reward={reward} />
			))}
		</div>
	);
}
