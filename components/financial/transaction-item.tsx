import { cn, formatBalance } from "@/lib/utils";
import type { TransactionRecord } from "@/types";
import { categoryConfig, defaultCategoryConfig } from "./constants";

type TransactionItemProps = TransactionRecord;

export function TransactionItem({
	category,
	description,
	createdAt,
	amount,
	type,
}: TransactionItemProps) {
	const categoryName = category || "Others";
	const config = categoryConfig[categoryName] || defaultCategoryConfig;
	const IconComponent = config.icon;

	const time = new Date(createdAt).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	const amountNumber = Number(amount);
	const isIncome = type === "DEPOSIT" || type === "YIELD";

	return (
		<div className="flex items-center gap-3 px-4 py-3">
			<div
				className={cn(
					"flex h-10 w-10 items-center justify-center rounded-full text-white",
					config.color,
				)}
			>
				<IconComponent className="h-5 w-5" />
			</div>

			<div className="flex-1">
				<p className="font-medium">{description || categoryName}</p>
				<p className="text-muted-foreground text-xs">{time}</p>
			</div>

			<span
				className={cn(
					"font-semibold",
					isIncome ? "text-green-600" : "text-foreground",
				)}
			>
				{isIncome ? "+" : "-"}
				{formatBalance(Math.abs(amountNumber), {
					withoutCurrencySymbol: true,
				})}
			</span>
		</div>
	);
}
