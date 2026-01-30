"use client";

import { useState } from "react";
import { ethAddressSchema } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { transferCrypto } from "@/rpc";
import { useSaveContact } from "./use-save-contact";
import { useTransferredAccounts } from "./use-transferred-accounts";
import { useDailySpending } from "./use-daily-spending";
import { useCurrentWallet } from "./use-current-wallet";

const transferFormSchema = z.object({
	destinationAddress: ethAddressSchema,
	amount: z.number().min(1, "Minimum transfer amount is 1 USDT"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
	category: z.string().max(20, "Category must be 20 characters or less"),
	description: z.string().max(100, "Description must be 100 characters or less").optional(),
});

export type TransferFormData = z.infer<typeof transferFormSchema>;

export const useTransferForm = (walletId?: string) => {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const searchParams = useSearchParams();

	// Save contact state
	const [saveAsContact, setSaveAsContact] = useState(false);
	const [contactName, setContactName] = useState("");
	const [contactError, setContactError] = useState("");

	// Wallet & Spending hooks
	const { data: wallet } = useCurrentWallet();
	const { data: spendingData } = useDailySpending(wallet ?? undefined);

	// Hooks for contacts
	const { data: contacts } = useTransferredAccounts();
	const saveContactMutation = useSaveContact();

	// Pre-fill destination address from URL query param
	const initialAddress = searchParams.get("address") ?? "";

	const form = useForm<TransferFormData>({
		defaultValues: {
			destinationAddress: initialAddress,
			amount: 1,
			password: "",
			category: "",
			description: "",
		},
		resolver: zodResolver(transferFormSchema),
	});

	// Watch destination address reactively (useWatch triggers re-render)
	const destinationAddress = useWatch({
		control: form.control,
		name: "destinationAddress",
		defaultValue: initialAddress,
	});

	// Watch amount reactively
	const amount = useWatch({
		control: form.control,
		name: "amount",
		defaultValue: 1,
	});

	// Check if address is valid (starts with 0x and has 42 chars)
	const isValidAddress =
		destinationAddress.length === 42 && destinationAddress.startsWith("0x");

	// Check if address is already in contacts
	const isExistingContact =
		isValidAddress &&
		!!contacts?.some(
			(contact) =>
				contact.walletAddress.toLowerCase() === destinationAddress.toLowerCase(),
		);

	// Show save option for new, valid addresses
	const showSaveOption = isValidAddress && !isExistingContact;

	// Reset save contact state when selecting a contact
	const resetSaveContact = () => {
		setSaveAsContact(false);
		setContactName("");
		setContactError("");
	};

	// Daily Limit Validation
	const dailyLimitStatus = (() => {
		if (!spendingData) return { isOverLimit: false, isNearLimit: false, remaining: 0, maxDailySpending: 0 };
		
		const { currentSpending, maxDailySpending } = spendingData;
		const potentialTotal = currentSpending + amount;
		const remaining = Math.max(0, maxDailySpending - currentSpending);
		
		return {
			isOverLimit: potentialTotal > maxDailySpending,
			isNearLimit: potentialTotal >= maxDailySpending * 0.8 && potentialTotal <= maxDailySpending,
			remaining,
			maxDailySpending,
		};
	})();

	const transferAction = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate contact name if saving
		if (saveAsContact && !contactName.trim()) {
			setContactError("Contact name is required");
			return;
		}
		setContactError("");

		startTransition(() => {
			form.handleSubmit(async (data) => {
				try {
					if (!walletId) {
						throw new Error("Wallet ID is required for transfer");
					}

					const result = await transferCrypto({
						...data,
						walletId,
					});

					// Save contact if opted in
					if (saveAsContact && contactName.trim()) {
						await saveContactMutation.mutateAsync({
							name: contactName.trim(),
							walletAddress: data.destinationAddress,
						});
					}

					// Navigate to result page with transaction details
					const params = new URLSearchParams({
						txId: result.transactionId,
						amount: result.amount.toString(),
						fee: result.fee.toString(),
						address: result.destinationAddress,
					});

					router.push(`/actions/transfer/result?${params.toString()}`);

					toast.success("Transfer successful!", {
						description: `Transferred ${result.amount} USDT`,
					});
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Transfer failed. Please try again.";

					form.setError("root", { message });
					toast.error("Transfer failed", {
						description: message,
					});
				}
			})();
		});
	};

	return {
		form,
		isPending,
		transferAction,
		// Save contact
		showSaveOption,
		saveAsContact,
		setSaveAsContact,
		contactName,
		setContactName,
		contactError,
		resetSaveContact,
		dailyLimitStatus,
	};
};
