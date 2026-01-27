import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionListSkeleton() {
	return (
		<div className="space-y-6">
			{[1, 2].map((i) => (
				<div key={i} className="space-y-3">
					<Skeleton className="h-4 w-48" />
					<Card>
						<CardContent className="divide-y p-0">
							{[1, 2, 3].map((j) => (
								<div key={j} className="flex items-center gap-3 px-4 py-3">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-20" />
									</div>
									<Skeleton className="h-4 w-24" />
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			))}
		</div>
	);
}
