"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";

export function useRequestApproval(walletId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => rpc.requestDailyLimitApproval(walletId),
		onSuccess: (response) => {
			if (response.success) {
				toast.success("Approval Request Sent", {
					description:
						response.message || "Emergency contacts will be notified",
				});
				// Invalidate notifications to show the new approval request notification
				queryClient.invalidateQueries({
					queryKey: queryKeys.notifications.all,
				});
			} else {
				toast.error("Request Failed", {
					description: response.error || "Unable to send approval request",
				});
			}
		},
		onError: (error: Error) => {
			toast.error("Request Failed", {
				description: error.message || "An unexpected error occurred",
			});
		},
	});
}
