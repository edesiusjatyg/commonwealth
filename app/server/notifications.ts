"use server";

import { prisma } from "@/lib/prisma";
import { NotificationsResponse, NotificationRecord } from "@/types";
import { z } from "zod";

// Input schemas
const getNotificationsSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

const markNotificationReadSchema = z.object({
	notificationId: z.string().min(1, "Notification ID is required"),
});

// Input types
export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
export type MarkNotificationReadInput = z.infer<
	typeof markNotificationReadSchema
>;

// Response type for mark as read
export type MarkNotificationReadResponse = {
	message: string;
	error?: string;
};

/**
 * Get notifications for a user
 */
export async function getNotifications(
	input: GetNotificationsInput,
): Promise<NotificationsResponse> {
	console.info("[notifications.getNotifications] Fetching notifications", { 
		userId: input.userId 
	});
	
	try {
		const validatedData = getNotificationsSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[notifications.getNotifications] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				notifications: [],
			};
		}

		const { userId } = validatedData.data;

		const notifications = await prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: 50,
		});

		const records: NotificationRecord[] = notifications.map((n) => ({
			id: n.id,
			userId: n.userId,
			title: n.title,
			message: n.message,
			type: n.type,
			read: n.read,
			createdAt: n.createdAt,
		}));

		console.info("[notifications.getNotifications] Notifications fetched", { 
			userId,
			count: records.length,
			unreadCount: records.filter(n => !n.read).length
		});
		return { notifications: records };
	} catch (error: unknown) {
		console.error("[notifications.getNotifications] Notification fetch error:", error);
		return {
			error: "Internal server error",
			notifications: [],
		};
	}
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
	input: MarkNotificationReadInput,
): Promise<MarkNotificationReadResponse> {
	console.info("[notifications.markNotificationRead] Marking notification as read", { 
		notificationId: input.notificationId 
	});
	
	try {
		const validatedData = markNotificationReadSchema.safeParse(input);

		if (!validatedData.success) {
			console.warn("[notifications.markNotificationRead] Validation failed", { 
				error: validatedData.error.issues[0].message 
			});
			return {
				error: validatedData.error.issues[0].message,
				message: "Validation failed",
			};
		}

		const { notificationId } = validatedData.data;

		await prisma.notification.update({
			where: { id: notificationId },
			data: { read: true },
		});

		console.info("[notifications.markNotificationRead] Notification marked as read", { 
			notificationId 
		});
		return { message: "Notification marked as read" };
	} catch (error: unknown) {
		console.error("[notifications.markNotificationRead] Mark notification read error:", error);
		return {
			error: "Failed to update notification",
			message: "Error",
		};
	}
}
