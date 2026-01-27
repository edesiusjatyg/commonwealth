"use client";

import ActionLayout from "@/components/layouts/actionsLayout";
import { WalletAddressDisplay } from "@/components/deposit/wallet-address-display";

export default function DepositPage() {
	return (
		<ActionLayout title="Deposit">
			<div className="w-full rounded-md p-4 shadow-sm">
				<WalletAddressDisplay />
			</div>
		</ActionLayout>
	);
}