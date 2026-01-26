"use client";
import { useQuery } from "@tanstack/react-query";
import { getTransferredAccounts, TransferredAccountDTO } from "@/rpc";
import { truncateText } from "@/lib/utils";

export type TransferredAccount = {
	name: string;
	accountNumber: string;
	avatarUrl?: string;
   shortName: string;
   shortenedWalletAddress: string;
   walletAddress: string;
};

const getShortName = (name: string) => {
   const first2words = name.split(" ").slice(0, 2).join(" ");
   return truncateText(first2words, 30);
}

const getShortenedEthAddress = (address: string) => {
   return address.slice(0, 6) + "..." + address.slice(-4);
}

const toPresentation = (data: TransferredAccountDTO): TransferredAccount => {
	return  {
      ...data,
      shortName: getShortName(data.name),
      shortenedWalletAddress: getShortenedEthAddress(data.ethAddress),
      walletAddress: data.ethAddress
   }
};

export const useTransferredAccounts = () => {
	return useQuery({
		queryKey: ["transfer-history"],
		queryFn: () => getTransferredAccounts(),
      select: (data) => {
         return data.map(toPresentation);
      },
		retry: true,
	});
};
