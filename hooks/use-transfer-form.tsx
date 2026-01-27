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

const transferFormSchema = z.object({
	destinationAddress: ethAddressSchema,
	amount: z.number().min(1, "Minimum transfer amount is 1 USDT"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type TransferFormData = z.infer<typeof transferFormSchema>;

export const useTransferForm = () => {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const searchParams = useSearchParams();

	// Save contact state
	const [saveAsContact, setSaveAsContact] = useState(false);
	const [contactName, setContactName] = useState("");
	const [contactError, setContactError] = useState("");

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
		},
		resolver: zodResolver(transferFormSchema),
	});

	// Watch destination address reactively (useWatch triggers re-render)
	const destinationAddress = useWatch({
		control: form.control,
		name: "destinationAddress",
		defaultValue: initialAddress,
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
					const result = await transferCrypto(data);

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
	};
};
