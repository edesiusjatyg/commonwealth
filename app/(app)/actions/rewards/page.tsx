"use client";

import ActionLayout from "@/components/layouts/actionsLayout";
import { RewardsList } from "@/components/rewards/rewards-list";

export default function RewardsPage() {
	return (
		<ActionLayout title="Rewards">
			<div className="w-full rounded-md p-4 shadow-sm">
				<RewardsList />
			</div>
		</ActionLayout>
	);
}