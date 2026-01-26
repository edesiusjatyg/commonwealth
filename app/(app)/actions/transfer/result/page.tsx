"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { truncateText } from "@/lib/utils";
import { Suspense } from "react";

export default function TransferResultPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// FIXME: use id instead of searchparams
	const txId = searchParams.get("txId") || "";
	const amount = searchParams.get("amount") || "0";
	const fee = searchParams.get("fee") || "0";
	const address = searchParams.get("address") || "";

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	// TODO: finalize path on done
	const handleDone = () => {
		router.push("/home");
	};

	return (
		// FIXME: Suspense is a temporary fix for hydration issues
		<Suspense fallback={<div>Loading...</div>}>
			<main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mb-4 flex justify-center">
							<div className="flex size-16 items-center justify-center rounded-full bg-green-100">
								<CheckCircle2 className="size-10 text-green-600" />
							</div>
						</div>
						<CardTitle className="text-2xl">Transfer Successful!</CardTitle>
						<CardDescription>
							Your transaction has been processed
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Status</span>
								<Badge variant="default" className="bg-green-600">
									Success
								</Badge>
							</div>
							<Separator />
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Amount</span>
								<span className="font-semibold">{amount} USDT</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Fee</span>
								<span className="text-muted-foreground text-sm">
									{fee} USDT
								</span>
							</div>
							<Separator />
							<div className="space-y-2">
								<span className="text-muted-foreground text-sm">
									Transaction ID
								</span>
								<div className="flex items-center gap-2">
									<code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs">
										{truncateText(txId, 20)}
									</code>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => copyToClipboard(txId, "Transaction ID")}
									>
										<Copy className="size-4" />
									</Button>
								</div>
							</div>
							<div className="space-y-2">
								<span className="text-muted-foreground text-sm">
									Destination Address
								</span>
								<div className="flex items-center gap-2">
									<code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs">
										{truncateText(address, 20)}
									</code>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => copyToClipboard(address, "Address")}
									>
										<Copy className="size-4" />
									</Button>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Time</span>
								<span className="text-muted-foreground text-sm">
									{new Date().toLocaleString()}
								</span>
							</div>
						</div>
						<Separator />
						<div className="flex gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => router.push("/actions/transfer")}
							>
								New Transfer
							</Button>
							<Button className="flex-1" onClick={handleDone}>
								Done
							</Button>
						</div>
					</CardContent>
				</Card>
			</main>
		</Suspense>
	);
}
