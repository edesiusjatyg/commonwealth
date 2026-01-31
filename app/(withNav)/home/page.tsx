import { DailySpendingCard } from "@/components/daily-spending-card";
import { TopBar } from "@/components/top-bar";
import { TopMarketValueCard } from "@/components/top-market-value-card";
import { WalletActions } from "@/components/wallet-actions/wallet-actions";
import { WalletCard } from "@/components/wallet-card";
import { WalletInsightCard } from "@/components/wallet-insight-card";
import Image from "next/image";

export default function Home() {
	return (
		<>
			<TopBar />
			<main className="container flex min-h-screen w-full flex-col items-center gap-8 bg-background">
				<Image
					src={"/wallet-card-backdrop.png"}
					alt="wallet-card-backdrop"
					width={500}
					height={160}
				/>
				<WalletCard className="mt-[-60] md:mt-[-80] lg:mt-[-100]" />
				<WalletActions className="mt-2" />
				<WalletInsightCard className="w-full" />
				{/* <DailySpendingCard /> */}
				<TopMarketValueCard />
			</main>
		</>
	);
}
