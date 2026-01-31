"use client";

import { useUser } from "@/hooks/use-user";
import { useInitWallet } from "@/hooks/use-init-wallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader2, Mail, Wallet, Banknote, AlertCircle, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InitWalletPage() {
	const { data: user, isLoading: isUserLoading } = useUser();
	const { 
		form, 
		onSubmit, 
		isPending, 
		emergencyContacts,
		updateContactEmail,
		updateContactName 
	} = useInitWallet(user?.id || "");

	if (isUserLoading) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-white via-white to-pink-50/50">
				<div className="w-full max-w-sm space-y-6">
					<Skeleton className="h-10 w-3/4 mx-auto" />
					<Skeleton className="h-12 w-full rounded-full" />
					<Skeleton className="h-12 w-full rounded-full" />
					<Skeleton className="h-24 w-full rounded-2xl" />
					<Skeleton className="h-12 w-full rounded-full" />
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-white via-white to-pink-50/50">
				<AlertCircle className="h-12 w-12 text-destructive mb-4" />
				<h2 className="text-xl font-bold">Unauthorized</h2>
				<p className="text-muted-foreground text-center mt-2">
					Please log in to set up your wallet.
				</p>
				<Button className="mt-6 rounded-full" onClick={() => window.location.href = "/login"}>
					Go to Login
				</Button>
			</div>
		);
	}

	return (
		<main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-white via-white to-pink-50/50 px-6 py-12">
			{/* Decorative purple circle - top left (same as login) */}
			<div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600" />

			{/* Content container */}
			<div className="relative z-10 flex w-full max-w-sm flex-col items-center pt-24">
				{/* Title */}
				<h1 className="mb-10 text-center text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
					Setup Your Wallet
				</h1>

				{/* Form */}
				<Form {...form}>
					<form onSubmit={onSubmit} className="w-full space-y-4">
						{/* Wallet Name field with icon */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="relative">
											<Wallet className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
											<Input
												placeholder="Wallet Nickname"
												disabled={isPending}
												className="h-12 rounded-full border-gray-200 bg-white pl-12 shadow-sm"
												{...field}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
					/>

					{/* Daily Limit field with slider-in-box style but matching auth theme */}
					<FormField
						control={form.control}
						name="dailyLimit"
						render={({ field }) => (
							<FormItem className="space-y-3 px-1 pt-6">
								<div className="">
									<div className="flex items-center justify-between">
										<FormLabel className="text-sm font-semibold text-muted-foreground">
											Daily Limit (USD)
										</FormLabel>
										<span className="text-sm font-bold text-violet-600">
											${field.value.toLocaleString()}
										</span>
									</div>
									<span className="text-xs text-muted-foreground">Set slider to 0 for no limit</span>
								</div>
								<FormControl>
									<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
										<div className="flex items-center gap-3">
											<Banknote className="h-5 w-5 text-muted-foreground" />
											<Slider
												min={0}
												max={5000}
												step={50}
												value={[field.value]}
												onValueChange={(val) => field.onChange(val[0])}
												className="flex-1"
												disabled={isPending}
											/>
										</div>
										<Input
											type="number"
											className="h-9 border-none bg-gray-50 text-center font-mono font-bold focus-visible:ring-0"
											{...field}
											onChange={(e) => field.onChange(Number(e.target.value))}
											disabled={isPending}
										/>
									</div>
								</FormControl>
								<FormDescription className="text-[10px] leading-tight text-muted-foreground">
									Over-limit transfers will require emergency contact approval.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Emergency Contacts Section */}
					<div className="space-y-3 px-1 pt-4">
						<FormLabel className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
							<Mail className="h-4 w-4" />
							Emergency Contacts (Required: 2)
						</FormLabel>
						
						<p className="text-[10px] leading-tight text-muted-foreground mb-3">
							Emergency contacts approve expenses when you exceed your daily limit. <strong>Exactly 2 contacts are required.</strong>
						</p>

						{/* Contact 1 */}
						<Card className="p-3 space-y-2">
							<p className="text-xs font-medium text-muted-foreground">Contact 1</p>
							<Input
								type="email"
								placeholder="Emergency email *"
								value={emergencyContacts?.[0]?.email || ""}
								onChange={(e) => updateContactEmail(0, e.target.value)}
								disabled={isPending}
								className="h-10"
							/>
							<Input
								type="text"
								placeholder="Name (optional)"
								value={emergencyContacts?.[0]?.name || ""}
								onChange={(e) => updateContactName(0, e.target.value)}
								disabled={isPending}
								className="h-10"
							/>
						</Card>

						{/* Contact 2 */}
						<Card className="p-3 space-y-2">
							<p className="text-xs font-medium text-muted-foreground">Contact 2</p>
							<Input
								type="email"
								placeholder="Emergency email *"
								value={emergencyContacts?.[1]?.email || ""}
								onChange={(e) => updateContactEmail(1, e.target.value)}
								disabled={isPending}
								className="h-10"
							/>
							<Input
								type="text"
								placeholder="Name (optional)"
								value={emergencyContacts?.[1]?.name || ""}
								onChange={(e) => updateContactName(1, e.target.value)}
								disabled={isPending}
								className="h-10"
							/>
						</Card>

						{form.formState.errors.emergencyContacts && (
							<p className="text-xs text-destructive">
								{form.formState.errors.emergencyContacts.message}
							</p>
						)}
					</div>

						{/* Info note */}
						<div className="flex items-start gap-2 px-1 py-1">
							<ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-violet-600" />
							<p className="text-[10px] leading-tight text-muted-foreground">
								Your wallet uses Multi-sig security on Base L2. You can update these settings later in your profile.
							</p>
						</div>

						{/* Error message */}
						{form.formState.errors.root && (
							<div className="text-sm text-destructive text-center">
								{form.formState.errors.root.message}
							</div>
						)}

						{/* Submit button */}
						<Button
							type="submit"
							className="mt-6 h-12 w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-semibold shadow-lg hover:from-violet-700 hover:to-indigo-600"
							disabled={isPending}
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating Account...
								</>
							) : (
								"Create My Wallet"
							)}
						</Button>
					</form>
				</Form>
			</div>
		</main>
	);
}
