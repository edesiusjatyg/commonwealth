import { Card, CardContent } from "@/components/ui/card";

interface TransactionEmptyStateProps {
	monthName: string;
}

export function TransactionEmptyState({
	monthName,
}: TransactionEmptyStateProps) {
	return (
         <Card>
            <CardContent className="py-12 text-center">
               <p className="text-muted-foreground">
                  No transactions found for {monthName}
               </p>
            </CardContent>
         </Card>
	);
}
