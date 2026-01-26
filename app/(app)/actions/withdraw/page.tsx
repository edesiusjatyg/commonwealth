"use client";
import ActionLayout from "@/components/layouts/actionsLayout";
import { WithdrawForm } from "@/components/withdraw/withdraw-form";

export default function WithdrawActionPage() {
	return (
		<ActionLayout title="Withdraw">
			<div className="w-full rounded-md p-4 shadow-sm">
				<WithdrawForm />
			</div>
		</ActionLayout>
	);
}
