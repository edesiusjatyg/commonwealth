"use client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Sparkline, generateSparklineData } from "@/components/trading/sparkline";

interface Market {
	id: number;
	rank: number;
	symbol: string;
	name: string;
	slug: string;
	price: number;
	change1h: number;
	change24h: number;
	change7d: number;
	marketCap: number;
	volume24h: number;
	logo: string;
}

const useTopMarketValue = () => {
	return useQuery<Market[]>({
		queryKey: ["top-market-value-cryptocurrencies"],
		queryFn: async () => {
			const res = await fetch("/api/markets?limit=5");
			const data = await res.json();
			if (data.success) {
				return data.data;
			}
			throw new Error("Failed to fetch markets");
		},
		retry: true,
		staleTime: 60000, // 1 minute
	});
};

function formatPrice(price: number): string {
	if (price >= 1) {
		return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
	return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function TopMarketValueCard() {
	const q = useTopMarketValue();

	const Content = () => {
		if (q.isLoading)
			return (
				Array(5)
					.fill(0)
					// biome-ignore lint/suspicious/noArrayIndexKey: stable idx
					.map((_, idx) => <CurrencyItemLoading key={idx} />)
			);
		if (q.isError || !q.data) return <div>Error loading data.</div>;
		return q.data.map((market) => (
			<CurrencyItem key={market.id} market={market} />
		));
	};

	return (
		<div className="flex w-full flex-col gap-4 rounded-lg p-4 shadow-sm">
			<span className="flex items-center gap-2">
				<h3 className="">Market</h3>
				<p className="text-xs">Top Market Value</p>
			</span>
			<div className="flex w-full flex-col gap-2">
				<Content />
			</div>
		</div>
	);
}

export const CurrencyItemLoading = () => {
	return (
		<div className="flex w-full items-center justify-between rounded-sm p-2 hover:bg-primary/5">
			<div className="flex items-center gap-3">
				<Skeleton className="h-8 w-8 rounded-full" />
				<div className="flex flex-col">
					<Skeleton className="mb-1 h-4 w-16" />
					<Skeleton className="h-3 w-12" />
				</div>
			</div>
			<div className="flex items-center gap-4">
				<Skeleton className="h-5 w-12" />
				<Skeleton className="h-4 w-14" />
			</div>
		</div>
	);
};

export function CurrencyItem({ market }: { market: Market }) {
	const { id, symbol, name, price, change24h, logo } = market;
	const isPositive = change24h >= 0;
	const sparklineData = generateSparklineData(change24h);

	return (
		<Link
			href={`/trading/${symbol.toLowerCase()}`}
			className="flex w-full items-center justify-between rounded-sm p-2 hover:bg-primary/5 transition-colors"
		>
			<div className="flex items-center gap-3">
				<div className="relative h-8 w-8 flex-shrink-0">
					<Image
						src={logo}
						alt={name}
						fill
						className="rounded-full object-cover"
						onError={(e) => {
							(e.target as HTMLImageElement).src = '/default-token.png';
						}}
					/>
				</div>
				<div className="flex flex-col">
					<span className="font-medium text-sm">{symbol}</span>
					<span className="text-muted-foreground text-xs">{name}</span>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<Sparkline
					data={sparklineData}
					width={40}
					height={16}
					positive={isPositive}
				/>
				<div className="flex flex-col items-end">
					<span className="font-mono text-sm">${formatPrice(price)}</span>
					<span
						className={cn(
							"text-xs font-medium",
							isPositive ? "text-green-500" : "text-red-500",
						)}
					>
						{isPositive ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`}
					</span>
				</div>
			</div>
		</Link>
	);
}
