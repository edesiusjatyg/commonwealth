import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationsResponse, NotificationRecord } from '@/types';

export async function GET(request: Request): Promise<NextResponse<NotificationsResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required', notifications: [] }, { status: 400 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const records: NotificationRecord[] = notifications.map(n => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            createdAt: n.createdAt,
        }));

        return NextResponse.json({ notifications: records });
    } catch (error: any) {
        console.error('Notification fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error', notifications: [] },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request): Promise<NextResponse<{ message: string; error?: string }>> {
    try {
        const body = await request.json();
        const { notificationId } = body;

        await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });

        return NextResponse.json({ message: 'Notification marked as read' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update notification', message: 'Error' }, { status: 500 });
    }
}
