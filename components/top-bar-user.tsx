"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

export const TopBarUserLoading = () => {
	return (
		<div className="flex items-center gap-4">
			<Avatar className="size-12 animate-pulse bg-accent">
				<AvatarImage />
			</Avatar>
			<div className="space-y-2">
				<Skeleton className="h-4 w-12" />
				<Skeleton className="h-4 w-24" />
			</div>
		</div>
	);
};

export function TopBarUserContainer() {
	const userQuery = useUser();
	const router = useRouter();

	// useEffect(() => {
	// 	if (!userQuery.isLoading && !userQuery.data) {
	// 		router.push("/login");
	// 	}	
   // }, [userQuery.isLoading, userQuery.data, router]);

	if (userQuery.isLoading) return <TopBarUserLoading />;
	if (userQuery.isError || !userQuery.data) return null;
   if (!userQuery.isLoading && !userQuery.data) {
      router.push("/login");
   }
   // if (!userQuery.data.onboarded) {
   //    toast.warning("Please Complete Onboarding First", {
   //       description: "To access your wallet, please complete onboarding.", 
   //    })
	// 	router.push("/onboarding");
   // }

	const displayName = userQuery.data.email?.split("@")[0] || "User";

	return <TopBarUserComplete username={displayName} />;
}

export const TopBarUserComplete = ({ username }: { username: string }) => {
	return (
		<div className="flex items-center gap-4">
			<Avatar className="size-12 bg-gray-400">
				<AvatarImage src="" />
				<AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
			</Avatar>
			<div>
				<h2 className="text-sm text-muted-foreground">Hello!</h2>
				<h1 className="font-bold text-lg leading-tight">{username}</h1>
			</div>
		</div>
	);
};
