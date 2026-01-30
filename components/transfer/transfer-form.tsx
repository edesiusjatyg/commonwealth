"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { useTransferForm } from "@/hooks/use-transfer-form";
import { useCurrentWallet } from "@/hooks/use-current-wallet";
import { useRouter } from "next/navigation";
import { ContactSelector } from "./contact-selector";
import { cn } from "@/lib/utils";

export function TransferForm() {
	const router = useRouter();
	const { data: wallet, isLoading: walletLoading } = useCurrentWallet();
	
	const {
		form,
		isPending,
		transferAction,
		showSaveOption,
		saveAsContact,
		setSaveAsContact,
		contactName,
		setContactName,
		contactError,
		resetSaveContact,
		dailyLimitStatus,
	} = useTransferForm(wallet?.id);

	if (walletLoading) {
		return <div>Loading wallet...</div>;
	}

	if (!wallet) {
		return <div>No wallet found. Please create one.</div>;
	}


	const handleContactSelect = (address: string) => {
		form.setValue("destinationAddress", address);
		resetSaveContact();
	};

	return (
		<Form {...form}>
			<form onSubmit={transferAction} className="space-y-6">
				<FormField
					control={form.control}
					name="destinationAddress"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Destination Address</FormLabel>
							<div className="flex gap-2">
								<FormControl className="flex-1">
									<Input placeholder="0x..." {...field} disabled={isPending} />
								</FormControl>
								<ContactSelector
									onSelect={handleContactSelect}
									disabled={isPending}
								/>
							</div>
							<FormDescription>
								Enter a valid Ethereum wallet address or select from contacts
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

            {
               showSaveOption && (
                  <>
						<div className="flex items-start space-x-3">
							<Checkbox
								id="saveAsContact"
								checked={saveAsContact}
								onCheckedChange={(checked) => {
									setSaveAsContact(checked === true);
									if (!checked) {
										setContactName("");
									}
								}}
								disabled={isPending}
							/>
								<Label htmlFor="saveAsContact" className="cursor-pointer">
									Save as contact
								</Label>
						</div>

						{saveAsContact && (
							<div className="space-y-2">
								<Label htmlFor="contactName">Contact Name</Label>
								<Input
									id="contactName"
									placeholder="Enter a name for this contact"
									value={contactName}
									onChange={(e) => setContactName(e.target.value)}
									disabled={isPending}
								/>
								{contactError && (
									<p className="text-destructive text-sm">{contactError}</p>
								)}
							</div>
						)}
                  </>
				)
            }

				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Amount (USDT)</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="1"
									{...field}
									onChange={(e) =>
										field.onChange(parseFloat(e.target.value) || 0)
									}
									disabled={isPending}
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
								<FormDescription>Minimum transfer: 1 USDT</FormDescription>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>
			<FormField
				control={form.control}
				name="category"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Category</FormLabel>
						<FormControl>
							<Input
								placeholder="e.g. Payment, Gift, Invoice"
								maxLength={20}
								{...field}
								disabled={isPending}
							/>
						</FormControl>
						<FormDescription>Max 20 characters</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Input
								placeholder="e.g. Payment for services"
								maxLength={100}
								{...field}
								disabled={isPending}
							/>
						</FormControl>
						<FormDescription>Optional. Max 100 characters</FormDescription>
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
									disabled={isPending}
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
						type="button"
						variant="secondary"
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
						{isPending ? "Processing..." : dailyLimitStatus.isOverLimit ? "Limit Exceeded" : "Transfer"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
