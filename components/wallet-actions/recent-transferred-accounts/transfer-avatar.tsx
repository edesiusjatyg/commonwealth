import { ArrowUpNarrowWide } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TransferredAccount } from "@/hooks/use-transferred-accounts";
import { cn } from "@/lib/utils";

export const TransferAvatar = ({
	account,
	isLoading,
	className,
}: {
	isLoading?: boolean;
	account?: TransferredAccount;
	className?: string;
}) => {
	return (
		<div className="relative">
			<Avatar className={cn("", className)}>
				{isLoading || !account ? (
					<AvatarImage />
				) : (
					<>
						<AvatarImage src={account.avatarUrl} />
						<AvatarFallback className="">
							{account.name.charAt(0)}
						</AvatarFallback>
					</>
				)}
			</Avatar>
			<div className="absolute right-0 bottom-0 translate-y-px-3 rounded-full border-2 border-background bg-primary p-1 text-background">
				<ArrowUpNarrowWide className="size-[10px]" />
			</div>
		</div>
	);
};
