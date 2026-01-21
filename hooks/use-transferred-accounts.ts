"use client";
import { useQuery } from "@tanstack/react-query";
import { delayedValueCallback } from "@/lib/utils";

export type TransferredAccount = {
	name: string;
	accountNumber: string;
	avatarUrl?: string;
};

const accountsVal: TransferredAccount[] = [
	{
		name: "Alice Johnson",
		accountNumber: "1234567890",
	},
	{
		name: "Bob Smith",
		accountNumber: "0987654321",
	},
	{
		name: "Charlie Brown",
		accountNumber: "1122334455",
	},
	{
		name: "Charlie White",
		accountNumber: "1124434455",
	},
];
export const useTransferredAccounts = () => {
	return useQuery({
		queryKey: ["transfer-history"],
		queryFn: delayedValueCallback(accountsVal, 1200),
		retry: true,
	});
};
