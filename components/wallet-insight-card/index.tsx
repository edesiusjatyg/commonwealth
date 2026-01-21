import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { WalletInsightContent } from "./wallet-insight-content";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

export function WalletInsightCard({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex gap-3 rounded-lg bg-background p-4 shadow-sm",
				className,
			)}
		>
			<Brain className="mt-2 size-8 shrink-0 text-primary" />
			<div className="min-w-0 flex-1">
				<h3 className="mb-2 text-md">AI Insight</h3>
				<Suspense
					fallback={
						<div className="w-full space-y-2">
							<Skeleton className="h-2 w-full" />
							<Skeleton className="h-2 w-full" />
							<Skeleton className="h-2 w-[30%]" />
						</div>
					}
				>
					<WalletInsightContent />
				</Suspense>
			</div>
		</div>
	);
}
