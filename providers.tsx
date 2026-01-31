"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MiniAppSdk } from "./components/mini-app-sdk";
import { Toaster } from "./components/ui/sonner";
import { WalletProvider } from "@/components/trading/wallet-provider";
import { PortfolioProvider } from "@/components/trading/portfolio-context";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const createQueryClient = () => new QueryClient();

export default function Providers({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [qc] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={qc}>
			<WalletProvider>
				<PortfolioProvider>
					<Toaster position="top-center" />
					<MiniAppSdk />
					{children}
				</PortfolioProvider>
			</WalletProvider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}

