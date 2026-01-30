"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/rpc";

export const useUser = () => {
	return useQuery({
		queryKey: ["user"],
		queryFn: fetchCurrentUser,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};
