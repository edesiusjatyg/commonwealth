"use client";

import { getRewards } from "@/rpc";
import { useQuery } from "@tanstack/react-query";

export const useRewards = (walletId?: string) => {
	return useQuery({
		queryKey: ["rewards", walletId],
		queryFn: () => getRewards(walletId),
		enabled: !!walletId,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});
};
