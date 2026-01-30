import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";
import { ReactScan } from "@/components/react-scan";
import { FloatingChatButton } from "@/components/chat/floating-chat-button";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Common Wealth",
	description: "Common Wealth is a human-first crypto wallet with built-in safety controls, financial tracking, and AI-assisted insights",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
         <head>
            <meta
            name="base:app_id"
            content="6978dfc33a92926b661fd891"
            />
         </head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ReactScan />
				<Providers>
					{children}
					<FloatingChatButton />
				</Providers>
			</body>
		</html>
	);
}
