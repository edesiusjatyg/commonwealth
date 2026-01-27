import { TransferAvatar } from "./transfer-avatar";

export const RecentTransferredAccountsLoading = () => {
	return (
		<div className="flex gap-2">
			{[0, 0, 0, 0].map((_, idx) => (
				<TransferAvatar
					isLoading={true}
					// biome-ignore lint/suspicious/noArrayIndexKey: stable index
					key={idx}
					className="size-16 animate-pulse bg-accent"
				/>
			))}
		</div>
	);
};
