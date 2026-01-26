"use client";
import { useQuery } from "@tanstack/react-query";
import { cn, delayedValueCallback } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

const useTopMarketValueCrypto = () => {
	return useQuery({
		queryKey: ["top-market-value-cryptocurrencies"],
		queryFn: delayedValueCallback(mockCryptocurrencies, 3000),
		retry: true,
	});
};

export function TopMarketValueCard() {
	const q = useTopMarketValueCrypto();
	const Content = () => {
		if (q.isLoading)
			return (
				Array(4)
					.fill(0)
					// biome-ignore lint/suspicious/noArrayIndexKey: stable idx
					.map((_, idx) => <CurrencyItemLoading key={idx} />)
			);
		if (q.isError || !q.data) return <div>Error loading data.</div>;
		return q.data.map((currency) => (
			<CurrencyItem key={currency.symbol} currency={currency} />
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

type CurrencyItemProps = {
	name: string;
	symbol: string;
	price: number;
	change24h: number;
};

export const mockCryptocurrencies: CurrencyItemProps[] = [
	{
		name: "Bitcoin",
		symbol: "BTC",
		price: 43125.75,
		change24h: 2.34,
	},
	{
		name: "Ethereum",
		symbol: "ETH",
		price: 2289.42,
		change24h: -1.12,
	},
	{
		name: "Tether",
		symbol: "USDT",
		price: 1.0,
		change24h: 0.01,
	},
	{
		name: "BNB",
		symbol: "BNB",
		price: 312.87,
		change24h: 0.84,
	},
	{
		name: "Solana",
		symbol: "SOL",
		price: 98.63,
		change24h: 4.91,
	},
	{
		name: "XRP",
		symbol: "XRP",
		price: 0.54,
		change24h: -0.67,
	},
	{
		name: "Cardano",
		symbol: "ADA",
		price: 0.49,
		change24h: 1.23,
	},
	{
		name: "Dogecoin",
		symbol: "DOGE",
		price: 0.082,
		change24h: -2.45,
	},
	{
		name: "Polkadot",
		symbol: "DOT",
		price: 7.12,
		change24h: 0.56,
	},
	{
		name: "Avalanche",
		symbol: "AVAX",
		price: 36.48,
		change24h: 3.78,
	},
];

export const CurrencyItemLoading = () => {
	return (
		<div className="flex w-full items-center justify-between rounded-sm p-2 hover:bg-primary/5">
			<div className="flex flex-col">
				<Skeleton className="mb-2 h-4 w-32" />
				<Skeleton className="h-3 w-20" />
			</div>
			<div>
				<Skeleton className="h-4 w-12" />
			</div>
		</div>
	);
};

export function CurrencyItem({ currency }: { currency: CurrencyItemProps }) {
	const { name, symbol, price, change24h } = currency;

	return (
		<div className="flex w-full items-center justify-between rounded-sm p-2 hover:bg-primary/5">
			<div className="flex flex-col">
				<span className="font-medium">
					{name} ({symbol})
				</span>
				<span className="text-muted-foreground text-sm">
					${price.toFixed(2)}
				</span>
			</div>
			<div>
				<span
					className={cn(
						"font-medium",
						change24h >= 0 ? "text-green-500" : "text-red-500",
					)}
				>
					{change24h >= 0
						? `+${change24h.toFixed(2)}%`
						: `${change24h.toFixed(2)}%`}
				</span>
			</div>
		</div>
	);
}
