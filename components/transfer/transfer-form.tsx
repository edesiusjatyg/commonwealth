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
import { useRouter } from "next/navigation";
import { ContactSelector } from "./contact-selector";

export function TransferForm() {
	const router = useRouter();
	const {
		form,
		isPending,
		transferAction,
		// Save contact from hook
		showSaveOption,
		saveAsContact,
		setSaveAsContact,
		contactName,
		setContactName,
		contactError,
		resetSaveContact,
	} = useTransferForm();

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
								/>
							</FormControl>
							<FormDescription>Minimum transfer: 1 USDT</FormDescription>
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
					<Button type="submit" disabled={isPending} className="flex-1">
						{isPending ? "Processing..." : "Transfer"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
