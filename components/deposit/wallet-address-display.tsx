"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { WalletAddressSkeleton } from "./wallet-address-skeleton";

function truncateAddress(address: string): string {
	if (address.length <= 16) return address;
	return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

export function WalletAddressDisplay() {
	const { data: wallet, isLoading: walletLoading } = useCurrentWallet();
	const { data, isLoading, isError } = useWalletAddress(wallet?.id);

	if (walletLoading || isLoading) return <WalletAddressSkeleton />;


	if (isError || !data) {
		return (
			<Card className="w-full">
				<CardContent className="py-8 text-center text-muted-foreground">
					Failed to load wallet address. Please try again.
				</CardContent>
			</Card>
		);
	}

	return <WalletAddressDisplay.Complete address={data.address} />;
}

WalletAddressDisplay.Complete = ({ address }: { address: string }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(address);
			setCopied(true);
			toast.success("Address copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy address");
		}
	};

	return (
		<Card className="w-full">
			<CardHeader className="items-center">
				<CardTitle className="text-lg">Your Wallet Address</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-4">
				{/* QR Code */}
				<div className="rounded-lg bg-white p-4">
					<QRCodeSVG
						value={address}
						size={192}
						level="H"
						includeMargin={false}
					/>
				</div>

				{/* Address display */}
				<div className="w-full rounded-lg border bg-muted/50 px-4 py-3 text-center font-mono text-sm">
					{truncateAddress(address)}
				</div>

				{/* Copy button */}
				<Button
					onClick={handleCopy}
					variant="outline"
					className="w-full gap-2"
				>
					{copied ? (
						<>
							<Check className="size-4" />
							Copied!
						</>
					) : (
						<>
							<Copy className="size-4" />
							Copy Address
						</>
					)}
				</Button>
			</CardContent>
		</Card>
	);
};
