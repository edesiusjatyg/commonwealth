"use client";

import ActionLayout from "@/components/layouts/actionsLayout";
import { TransferForm } from "@/components/transfer/transfer-form";

export default function TransferActionPage() {
	return (
		<ActionLayout title="Transfer">
			<div className="w-full rounded-md p-4 shadow-sm">
				<TransferForm />
			</div>
		</ActionLayout>
	);
}
