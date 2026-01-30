"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useWithdrawForm } from "@/hooks/use-withdraw-form";
import { useCurrentWallet } from "@/hooks/use-current-wallet";

const supportedBanks = [
	"BCA (Bank Central Asia)",
	"BNI (Bank Negara Indonesia)",
	"BRI (Bank Rakyat Indonesia)",
	"Mandiri",
	"CIMB Niaga",
	"Permata Bank",
	"Danamon",
] as const;

import { cn } from "@/lib/utils";

export function WithdrawForm() {
	const { data: wallet, isLoading: walletLoading } = useCurrentWallet();
	const { form, isPending, withdrawAction, dailyLimitStatus } = useWithdrawForm(wallet?.id);
	const router = useRouter();

	if (walletLoading) return <div>Loading wallet...</div>;
	if (!wallet) return <div>No wallet found. Please create one.</div>;

	return (
		<Form {...form}>
			<form onSubmit={withdrawAction} className="space-y-6">
				<FormField
					control={form.control}
					name="bank"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Bank</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl className="w-full">
									<SelectTrigger>
										<SelectValue placeholder="Select a bank" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{supportedBanks.map((bank) => (
										<SelectItem key={bank} value={bank}>
											{bank}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>Choose your bank for withdrawal</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="accountNumber"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Account Number</FormLabel>
							<FormControl>
								<Input placeholder="Enter your account number" {...field} />
							</FormControl>
							<FormDescription>Your bank account number</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Amount (USDT)</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="10"
									{...field}
									onChange={(e) =>
										field.onChange(parseFloat(e.target.value) || 0)
									}
									className={cn(
										dailyLimitStatus.isOverLimit && "border-destructive focus-visible:ring-destructive",
										dailyLimitStatus.isNearLimit && !dailyLimitStatus.isOverLimit && "border-amber-500 focus-visible:ring-amber-500"
									)}
								/>
							</FormControl>
							{dailyLimitStatus.isOverLimit ? (
								<p className="text-[10px] font-bold text-destructive uppercase tracking-tight">
									Daily limit exceeded. Remaining: ${dailyLimitStatus.remaining}
								</p>
							) : dailyLimitStatus.isNearLimit ? (
								<p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
									Near daily limit. Remaining: ${dailyLimitStatus.remaining}
								</p>
							) : (
								<FormDescription>Minimum withdrawal: 10 USDT</FormDescription>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="Enter your password"
									{...field}
								/>
							</FormControl>
							<FormDescription>
								Confirm with your account password
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{form.formState.errors.root && (
					<div className="text-destructive text-sm">
						{form.formState.errors.root.message}
					</div>
				)}

				<div className="flex w-full gap-2">
					<Button
						variant={"secondary"}
						onClick={() => router.back()}
						disabled={isPending}
						className="flex-1"
					>
						Back
					</Button>
					<Button 
						type="submit" 
						disabled={isPending || dailyLimitStatus.isOverLimit} 
						className="flex-1"
					>
						{isPending ? "Processing..." : dailyLimitStatus.isOverLimit ? "Limit Exceeded" : "Withdraw"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
