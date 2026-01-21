"use client";
import {
	type TransferredAccount,
	useTransferredAccounts,
} from "@/hooks/use-transferred-accounts";
import { RecentTransferredAccountsLoading } from "./loading";
import { TransferAvatar } from "./transfer-avatar";

export function RecentTransferredAccounts() {
	const q = useTransferredAccounts();
	if (q.isLoading) return <RecentTransferredAccountsLoading />;
	if (q.isError || !q.data) return <RecentTransferredAccountsLoading />;

	return <RecentTransferredAccounts.Complete accounts={q.data} />;
}

RecentTransferredAccounts.Complete = ({
	accounts,
}: {
	accounts: TransferredAccount[];
}) => {
	return (
		<div className="flex gap-2">
			{accounts.map((account, idx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: stable index
				<TransferAvatar key={idx} account={account} className="size-16" />
			))}
		</div>
	);
};
