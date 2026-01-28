"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, User, Shield, Wallet, AlertCircle } from "lucide-react";
import { useUpdateProfile, type Profile } from "@/hooks/use-profile";

interface ProfileContentProps {
	profile: Profile;
	walletId: string;
}

export function ProfileContent({ profile, walletId }: ProfileContentProps) {
	const [nickname, setNickname] = useState(profile.nickname);
	const [dailyLimit, setDailyLimit] = useState(profile.dailyLimit.toString());
	const [emergencyEmail, setEmergencyEmail] = useState(profile.emergencyEmail || "");
	const [hasChanges, setHasChanges] = useState(false);

	const updateProfile = useUpdateProfile();

	// Check for changes
	useEffect(() => {
		const nicknameChanged = nickname !== profile.nickname;
		const dailyLimitChanged = dailyLimit !== profile.dailyLimit.toString();
		const emergencyChanged = emergencyEmail !== (profile.emergencyEmail || "");

		setHasChanges(nicknameChanged || dailyLimitChanged || emergencyChanged);
	}, [nickname, dailyLimit, emergencyEmail, profile]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		updateProfile.mutate({
			walletId,
			nickname: nickname !== profile.nickname ? nickname : undefined,
			dailyLimit: dailyLimit !== profile.dailyLimit.toString() ? Number(dailyLimit) : undefined,
			emergencyEmail: emergencyEmail !== (profile.emergencyEmail || "") 
				? (emergencyEmail || null) 
				: undefined,
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
						<span className="text-sm text-muted-foreground">Wallet Address</span>
						<span className="font-mono text-sm font-medium">
							{profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
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
									Rp
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

						{/* Emergency Email */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="emergencyEmail" className="flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-muted-foreground" />
								Emergency Contact Email
							</Label>
							<Input
								id="emergencyEmail"
								type="email"
								value={emergencyEmail}
								onChange={(e) => setEmergencyEmail(e.target.value)}
								placeholder="emergency@example.com"
							/>
							<p className="text-xs text-muted-foreground">
								This contact will be notified for spending above your daily limit
							</p>
						</div>

						{/* Info Alert */}
						{hasChanges && (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									You have unsaved changes
								</AlertDescription>
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
		</div>
	);
}
