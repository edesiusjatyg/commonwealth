"use client";
import {
	type TransferredAccount,
	useTransferredAccounts,
} from "@/hooks/use-transferred-accounts";
import { useRouter } from "next/navigation";
import { RecentTransferredAccountsLoading } from "./loading";
import { TransferAvatar } from "./transfer-avatar";

export function RecentTransferredAccounts() {
	const q = useTransferredAccounts();
	if (q.isLoading) return <RecentTransferredAccountsLoading />;
	if (q.isError || !q.data) return <RecentTransferredAccountsLoading />;
   if (q.data.length === 0) return null;

	return <RecentTransferredAccounts.Complete accounts={q.data} />;
}

RecentTransferredAccounts.Complete = ({
	accounts,
}: {
	accounts: TransferredAccount[];
}) => {
	const router = useRouter();

	const handleTransferClick = (account: TransferredAccount) => {
		const params = new URLSearchParams({
			address: account.walletAddress,
		});
		router.push(`/actions/transfer?${params.toString()}`);
	};


	return (
		<div className="flex gap-2">
			{accounts.map((account, idx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: stable index
				<div key={account.walletAddress} className="flex flex-col gap-2 items-center">
               <TransferAvatar
                  key={idx}
                  account={account}
                  className="size-16"
                  onClick={() => handleTransferClick(account)}
               />
               <p className="text-xs text-center">{account.shortName}</p>
            </div>
			))}
		</div>
	);
};
