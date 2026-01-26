"use client";

import { getRewards } from "@/rpc";
import { useQuery } from "@tanstack/react-query";

export const useRewards = () => {
	return useQuery({
		queryKey: ["rewards"],
		queryFn: getRewards,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});
};
