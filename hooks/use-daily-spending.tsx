"use client";
import { delayedValue } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useDailySpending = () => {
	return useQuery({
		queryKey: ["financial-history", "expense"],
		queryFn: () =>
			delayedValue(
				{
					currentSpending: 400000,
					maxDailySpending: 2000000,
				},
				1000,
			),
		retry: true,
	});
};
