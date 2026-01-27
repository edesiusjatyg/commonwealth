"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as rpc from "@/rpc";
import type { NotificationRecord } from "@/types";

// TODO: Replace with actual user ID from session/context
const MOCK_USER_ID = "mock-user-id";

// UI-friendly notification type
export type Notification = NotificationRecord;

// Hook to fetch notifications
export function useNotifications(userId?: string) {
	const effectiveUserId = userId || MOCK_USER_ID;

	return useQuery({
		queryKey: queryKeys.notifications.list(effectiveUserId),
		queryFn: async (): Promise<Notification[]> => {
			const response = await rpc.fetchNotifications(effectiveUserId);

			if (response.error) {
				throw new Error(response.error);
			}

			return response.notifications;
		},
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
