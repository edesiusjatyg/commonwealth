import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function WalletAddressSkeleton() {
	return (
		<Card className="w-full">
			<CardHeader className="items-center">
				<Skeleton className="h-6 w-40" />
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-4">
				{/* QR Code skeleton */}
				<Skeleton className="size-48 rounded-lg" />
				{/* Address skeleton */}
				<Skeleton className="h-10 w-full" />
				{/* Copy button skeleton */}
				<Skeleton className="h-10 w-full" />
			</CardContent>
		</Card>
	);
}
