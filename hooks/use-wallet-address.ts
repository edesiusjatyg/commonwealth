"use client";
import { useQuery } from "@tanstack/react-query";
import { getWalletAddress } from "@/rpc";

export const useWalletAddress = () => {
	return useQuery({
		queryKey: ["wallet-address"],
		queryFn: getWalletAddress,
	});
};
