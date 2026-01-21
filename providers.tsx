"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniAppSdk } from "./components/mini-app-sdk";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
		},
	},
});

export default function Providers({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<QueryClientProvider client={queryClient}>
			<MiniAppSdk />
			{children}
		</QueryClientProvider>
	);
}
