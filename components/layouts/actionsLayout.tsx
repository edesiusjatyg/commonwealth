"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";

type ActionLayoutProps = {
	title: string;
	children: React.ReactNode;
};

export default function ActionLayout({ title, children }: ActionLayoutProps) {
	const router = useRouter();

	return (
		<main className="flex w-full flex-col">
			<header className="sticky top-0 z-10 flex w-full items-center gap-4 bg-background py-4">
				<button
					type="button"
					className={cn(
						"p-2 text-primary hover:bg-muted",
						buttonVariants({ variant: "ghost" }),
					)}
					onClick={() => router.back()}
				>
					<ArrowLeft className="size-6" />
				</button>
				<h1 className="font-semibold text-xl">{title}</h1>
			</header>
			{children}
		</main>
	);
}
