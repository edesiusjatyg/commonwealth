"use client";

import { Suspense } from "react";
import ActionLayout from "@/components/layouts/actionsLayout";
import { TransferForm } from "@/components/transfer/transfer-form";

function TransferContent() {
	return (
		<ActionLayout title="Transfer">
			<div className="w-full rounded-md p-4 shadow-sm">
				<TransferForm />
			</div>
		</ActionLayout>
	);
}

export default function TransferActionPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<TransferContent />
		</Suspense>
	);
}
