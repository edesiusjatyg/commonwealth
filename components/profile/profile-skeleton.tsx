import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileSkeleton() {
	return (
		<div className="container flex flex-col gap-6 py-6">
			{/* Header skeleton */}
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-48" />
			</div>

			{/* Profile card skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					{/* Email field */}
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>

					{/* Nickname field */}
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-10 w-full" />
					</div>

					{/* Daily limit field */}
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>

					{/* Emergency email field */}
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-10 w-full" />
					</div>

					{/* Save button */}
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
