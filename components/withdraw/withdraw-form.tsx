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

const supportedBanks = [
	"BCA (Bank Central Asia)",
	"BNI (Bank Negara Indonesia)",
	"BRI (Bank Rakyat Indonesia)",
	"Mandiri",
	"CIMB Niaga",
	"Permata Bank",
	"Danamon",
] as const;

export function WithdrawForm() {
	const { form, isPending, withdrawAction } = useWithdrawForm();
	const router = useRouter();

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
								/>
							</FormControl>
							<FormDescription>Minimum withdrawal: 10 USDT</FormDescription>
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
					<Button type="submit" disabled={isPending} className="flex-1">
						{isPending ? "Processing..." : "Withdraw"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
