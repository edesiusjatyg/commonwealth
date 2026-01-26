"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MiniAppSdk } from "./components/mini-app-sdk";
import { Toaster } from "./components/ui/sonner";

const createQueryClient = () => new QueryClient();

export default function Providers({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [qc] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={qc}>
			<Toaster position="top-center" />
			<MiniAppSdk />
			{children}
		</QueryClientProvider>
	);
}
