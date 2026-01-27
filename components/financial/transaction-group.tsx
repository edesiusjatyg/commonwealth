import { Card, CardContent } from "@/components/ui/card";
import { formatBalance } from "@/lib/utils";
import type { TransactionRecord } from "@/types";
import { TransactionItem } from "./transaction-item";

interface TransactionGroupProps {
	date: string;
	income: number;
	expenses: number;
	transactions: TransactionRecord[];
}

export function TransactionGroup({
	date,
	income,
	expenses,
	transactions,
}: TransactionGroupProps) {
	return (
		<div>
			<div className="mb-3 flex items-center justify-between text-sm">
				<span className="text-muted-foreground">{date}</span>
				<span className="text-muted-foreground">
					Income{" "}
					{formatBalance(income, {
						withoutCurrencySymbol: true,
					})}{" "}
					Expenses{" "}
					{formatBalance(expenses, {
						withoutCurrencySymbol: true,
					})}
				</span>
			</div>

			<Card>
				<CardContent className="divide-y p-0">
					{transactions.map((tx) => (
						<TransactionItem key={tx.id} {...tx} />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
