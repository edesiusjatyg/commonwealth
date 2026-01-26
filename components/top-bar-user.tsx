"use client";

import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";

export const TopBarUserLoading = () => {
	return (
		<div className="flex items-center gap-4">
			<Avatar className="size-12 animate-pulse bg-accent">
				<AvatarImage />
			</Avatar>
			<div className="space-y-2">
				<Skeleton className="h-4 w-8" />
				<Skeleton className="h-4 w-12" />
			</div>
		</div>
	);
};

export function TopBarUserContainer() {
	const userQuery = useUser();

	if (userQuery.isLoading) return <TopBarUserLoading />;
	if (userQuery.isError || !userQuery.data) return notFound();

	return <TopBarUserComplete username={userQuery.data.username} />;
}

export const TopBarUserComplete = ({ username }: { username: string }) => {
	return (
		<div className="flex items-center gap-4">
			<Avatar className="size-12 bg-gray-400">
				<AvatarImage src="" />
				<AvatarFallback>{username.charAt(0)}</AvatarFallback>
			</Avatar>
			<div>
				<h2>Hello!</h2>
				<h1 className="font-bold text-xl">{username}</h1>
			</div>
		</div>
	);
};
