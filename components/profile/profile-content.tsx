"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Loader2,
	Mail,
	User,
	Shield,
	Wallet,
	AlertCircle,
	LogOut,
	Copy,
} from "lucide-react";
import { useUpdateProfile, type Profile } from "@/hooks/use-profile";
import { EmergencyContactsManager } from "./emergency-contacts-manager";
import * as rpc from '@/rpc';
import { toast } from "sonner";

interface ProfileContentProps {
	profile: Profile;
	walletId: string;
}

export function ProfileContent({ profile, walletId }: ProfileContentProps) {
	const router = useRouter();
	const [nickname, setNickname] = useState(profile.nickname);
	const [dailyLimit, setDailyLimit] = useState(profile.dailyLimit.toString());
	const [hasChanges, setHasChanges] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
   const [copied, setCopied] = useState(false);

	const updateProfile = useUpdateProfile();

	// Check for changes
	useEffect(() => {
		const nicknameChanged = nickname !== profile.nickname;
		const dailyLimitChanged = dailyLimit !== profile.dailyLimit.toString();

		setHasChanges(nicknameChanged || dailyLimitChanged);
	}, [nickname, dailyLimit, profile]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		updateProfile.mutate({
			nickname: nickname !== profile.nickname ? nickname : undefined,
			dailyLimit:
				dailyLimit !== profile.dailyLimit.toString()
					? Number(dailyLimit)
					: undefined,
		});
	};

   const handleLogout = () => {
				const mutate = async () => {
					setIsLoggingOut(true);
					try {
						await rpc.logoutUser();
						toast.success("Logged out successfully");
						router.push("/login");
					} catch {
						toast.error("Logout failed", {
							description: "An unexpected error occurred",
						});
						setIsLoggingOut(false);
					}
				};

				toast("Are you sure you want to logout?", {
					position: "bottom-center",
					actionButtonStyle: {
						backgroundColor: "var(--destructive)",
					},
					action: {
						label: "Yes, logout",
						onClick: mutate,
					},
					cancel: {
						label: "No",
						onClick: () => {
							/* optional: do nothing */
						},
					},
				});
			};

	const formatCurrency = (value: string) => {
		const num = value.replace(/\D/g, "");
		return num ? Number(num).toLocaleString("id-ID") : "";
	};

	const handleDailyLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/\D/g, "");
		setDailyLimit(raw);
	};

	const handleCopy = async (address: string) => {
		try {
			await navigator.clipboard.writeText(address);
			setCopied(true);
			toast.success("Address copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy address");
		}
	};

	const CopyButton = () => (
		<Button
			className="size-icon ml-2 p-0 opacity-70 hover:opacity-100"
			variant={"ghost"}
			size={"icon-sm"}
			onClick={() => handleCopy(profile.walletAddress)}
		>
			<Copy />
		</Button>
	);

	return (
		<div className="container flex flex-col gap-6 py-6">
			{/* Header */}
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold">Profile Settings</h1>
				<p className="text-muted-foreground">
					Manage your wallet profile and security settings
				</p>
			</div>

			{/* Wallet Address Card */}
			<Card className="border-primary/20 bg-primary/5">
				<CardContent className="flex items-center gap-3 py-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
						<Wallet className="h-5 w-5 text-primary" />
					</div>
					<div className="flex flex-col">
						<span className="text-sm text-muted-foreground">
							Wallet Address{" "}
						</span>
						<span className="font-mono text-sm font-medium overflow-elipsis max-w-xs">
							{profile.walletAddress.slice(0, 6)}...
							{profile.walletAddress.slice(-4)}
							{/* {profile.walletAddress} */} <CopyButton />
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Profile Form */}
			<form onSubmit={handleSubmit}>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							Profile Information
						</CardTitle>
						<CardDescription>
							Update your wallet nickname and settings
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						{/* Email (readonly) */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="email" className="flex items-center gap-2">
								<Mail className="h-4 w-4 text-muted-foreground" />
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={profile.email}
								disabled
								className="bg-muted"
							/>
							<p className="text-xs text-muted-foreground">
								Email cannot be changed
							</p>
						</div>

						{/* Nickname */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="nickname">Wallet Nickname</Label>
							<Input
								id="nickname"
								type="text"
								value={nickname}
								onChange={(e) => setNickname(e.target.value)}
								placeholder="My Wallet"
							/>
						</div>

						{/* Daily Limit */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="dailyLimit" className="flex items-center gap-2">
								<Shield className="h-4 w-4 text-muted-foreground" />
								Daily Spending Limit
							</Label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
									$
								</span>
								<Input
									id="dailyLimit"
									type="text"
									value={formatCurrency(dailyLimit)}
									onChange={handleDailyLimitChange}
									className="pl-10"
									placeholder="0"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Set to 0 for unlimited spending
							</p>
						</div>

						{/* REMOVED: Emergency Email field - now managed separately */}

						{/* Info Alert */}
						{hasChanges && (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>You have unsaved changes</AlertDescription>
								<AlertDescription>You have unsaved changes</AlertDescription>
							</Alert>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							className="w-full"
							disabled={!hasChanges || updateProfile.isPending}
						>
							{updateProfile.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</CardContent>
				</Card>
			</form>

			{/* Emergency Contacts Manager */}
			<EmergencyContactsManager />
			<Button
				onClick={handleLogout}
				variant="destructive"
				className="w-full mt-4 mb-10"
				disabled={isLoggingOut}
			>
				Logout
			</Button>
			<div className="min-h-10" />
		</div>
	);
}
