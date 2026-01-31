"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as rpc from "@/rpc";
import { queryKeys } from "@/lib/queryKeys";

export function useEmergencyContacts(walletId: string) {
	return useQuery({
		queryKey: queryKeys.wallet.emergencyContacts(walletId),
		queryFn: () => rpc.getEmergencyContacts(walletId),
		enabled: !!walletId,
	});
}

export function useAddEmergencyContact(walletId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { email: string; name?: string }) =>
			rpc.addEmergencyContact({
				walletId,
				...data,
			}),
		onSuccess: (response) => {
			if (response.success) {
				toast.success("Emergency contact added", {
					description: response.message,
				});
				queryClient.invalidateQueries({
					queryKey: queryKeys.wallet.emergencyContacts(walletId),
				});
				queryClient.invalidateQueries({
					queryKey: queryKeys.profile.detail(walletId),
				});
			} else {
				toast.error("Failed to add contact", {
					description: response.error,
				});
			}
		},
		onError: (error: Error) => {
			toast.error("Failed to add contact", {
				description: error.message || "An unexpected error occurred",
			});
		},
	});
}

export function useRemoveEmergencyContact(walletId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (contactId: string) =>
			rpc.removeEmergencyContact({
				walletId,
				contactId,
			}),
		onSuccess: (response) => {
			if (response.success) {
				toast.success("Emergency contact removed", {
					description: response.message,
				});
				queryClient.invalidateQueries({
					queryKey: queryKeys.wallet.emergencyContacts(walletId),
				});
				queryClient.invalidateQueries({
					queryKey: queryKeys.profile.detail(walletId),
				});
			} else {
				toast.error("Failed to remove contact", {
					description: response.error,
				});
			}
		},
		onError: (error: Error) => {
			toast.error("Failed to remove contact", {
				description: error.message || "An unexpected error occurred",
			});
		},
	});
}
