"use client";

import ActionLayout from "@/components/layouts/actionsLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useNotifications,
	useMarkNotificationRead,
} from "@/hooks/use-notifications";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import {
	Bell,
	CheckCircle,
	AlertTriangle,
	DollarSign,
	Gift,
	Shield,
} from "lucide-react";

// Icon mapping for notification types
const notificationIcons: Record<string, React.ElementType> = {
	DEPOSIT_SUCCESS: DollarSign,
	WITHDRAWAL_SUCCESS: DollarSign,
	REWARD_RECEIVED: Gift,
	DAILY_LIMIT_ALERT: AlertTriangle,
	EMERGENCY_APPROVAL: Shield,
	DEFAULT: Bell,
};

// Color mapping for notification types
const notificationColors: Record<string, string> = {
	DEPOSIT_SUCCESS: "bg-green-500",
	WITHDRAWAL_SUCCESS: "bg-blue-500",
	REWARD_RECEIVED: "bg-purple-500",
	DAILY_LIMIT_ALERT: "bg-yellow-500",
	EMERGENCY_APPROVAL: "bg-red-500",
	DEFAULT: "bg-gray-500",
};

function formatRelativeTime(date: Date | string): string {
	const now = new Date();
	const notificationDate = new Date(date);
	const diffMs = now.getTime() - notificationDate.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return notificationDate.toLocaleDateString();
}

function NotificationsSkeleton() {
	return (
		<div className="space-y-3">
			{[1, 2, 3].map((i) => (
				<Card key={i}>
					<CardContent className="flex items-start gap-3 p-4">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-16" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<Bell className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="mb-1 font-semibold">No notifications</h3>
			<p className="text-sm text-muted-foreground">
				You're all caught up! Check back later for updates.
			</p>
		</div>
	);
}

export default function NotificationsPage() {
	const { data: user } = useUser();
	const { data: notifications, isLoading, isError } = useNotifications(user?.id);
	const markAsRead = useMarkNotificationRead();

	const handleNotificationClick = (notificationId: string, isRead: boolean) => {
		if (!isRead) {
			markAsRead.mutate(notificationId);
		}
	};

	return (
		<ActionLayout title="Notifications">
			<div className="space-y-3 p-4">
				{isLoading && <NotificationsSkeleton />}

				{isError && (
					<div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
						Failed to load notifications. Please try again.
					</div>
				)}

				{!isLoading && !isError && notifications?.length === 0 && (
					<EmptyState />
				)}

				{!isLoading &&
					!isError &&
					notifications?.map((notification) => {
						const IconComponent =
							notificationIcons[notification.type] || notificationIcons.DEFAULT;
						const iconColor =
							notificationColors[notification.type] ||
							notificationColors.DEFAULT;

						return (
							<Card
								key={notification.id}
								className={cn(
									"cursor-pointer transition-colors hover:bg-muted/50",
									!notification.read &&
										"border-l-4 border-l-primary bg-primary/5",
								)}
								onClick={() =>
									handleNotificationClick(notification.id, notification.read)
								}
							>
								<CardContent className="flex items-start gap-3 p-4">
									{/* Icon */}
									<div
										className={cn(
											"flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
											iconColor,
										)}
									>
										<IconComponent className="h-5 w-5" />
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-2">
											<h4 className="font-semibold">{notification.title}</h4>
											{!notification.read && (
												<Badge variant="default" className="shrink-0 text-xs">
													New
												</Badge>
											)}
										</div>
										<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
											{notification.message}
										</p>
										<p className="mt-2 text-xs text-muted-foreground">
											{formatRelativeTime(notification.createdAt)}
										</p>
									</div>

									{/* Read indicator */}
									{notification.read && (
										<CheckCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
									)}
								</CardContent>
							</Card>
						);
					})}
			</div>
		</ActionLayout>
	);
}
