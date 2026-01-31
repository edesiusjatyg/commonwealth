"use client";

import { useProfile } from "@/hooks/use-profile";
import { ProfileContent } from "@/components/profile/profile-content";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ProfilePage() {
	const { data: profile, isLoading, error, refetch } = useProfile();

	// 1. Loading state
	if (isLoading) {
		return <ProfileSkeleton />;
	}

	// 2. Error state
	if (error) {
		return (
			<div className="container flex flex-col items-center justify-center gap-4 py-12">
				<Alert variant="destructive" className="max-w-md">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error loading profile</AlertTitle>
					<AlertDescription>
						{error.message || "Something went wrong"}
					</AlertDescription>
				</Alert>
				<Button variant="outline" onClick={() => refetch()}>
					<RefreshCw className="mr-2 h-4 w-4" />
					Try Again
				</Button>
			</div>
		);
	}

	// 3. Empty state (shouldn't happen with valid wallet)
	if (!profile) {
		return (
			<div className="container flex flex-col items-center justify-center gap-4 py-12">
				<Alert className="max-w-md">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>No profile found</AlertTitle>
					<AlertDescription>
						We couldn't find your profile data. Please try again later.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	// 4. Success state
	return <ProfileContent profile={profile} walletId={profile.walletId} />;
}