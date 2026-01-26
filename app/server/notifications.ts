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
	try {
		const validatedData = getNotificationsSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: z.treeifyError(validatedData.error).errors[0],
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

		return { notifications: records };
	} catch (error: any) {
		console.error("Notification fetch error:", error);
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
	try {
		const validatedData = markNotificationReadSchema.safeParse(input);

		if (!validatedData.success) {
			return {
				error: z.treeifyError(validatedData.error).errors[0],
				message: "Validation failed",
			};
		}

		const { notificationId } = validatedData.data;

		await prisma.notification.update({
			where: { id: notificationId },
			data: { read: true },
		});

		return { message: "Notification marked as read" };
	} catch (error: any) {
		console.error("Mark notification read error:", error);
		return {
			error: "Failed to update notification",
			message: "Error",
		};
	}
}
