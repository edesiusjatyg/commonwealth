"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";
import type { NotificationRecord } from "@/types";

// UI-friendly notification type
export type UINotification = NotificationRecord;

// Hook to fetch notifications
export function useNotifications(userId: string | undefined) {
	return useQuery({
		queryKey: queryKeys.notifications.list(userId || ""),
		queryFn: async (): Promise<UINotification[]> => {
			if (!userId) return [];
			const response = await rpc.fetchNotifications(userId);

			if (response.error) {
				throw new Error(response.error);
			}

			return response.notifications;
		},
		enabled: !!userId,
	});
}

// Hook to mark notification as read
export function useMarkNotificationRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const response = await rpc.markNotificationAsRead(notificationId);

			if (response.error) {
				throw new Error(response.error);
			}

			return response;
		},
		onSuccess: () => {
			// Invalidate notifications query to refresh the list
			queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
		},
	});
}
