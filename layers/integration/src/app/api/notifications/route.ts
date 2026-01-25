import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({ notifications });
    } catch (error: any) {
        console.error('Notification fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { notificationId } = body;

        await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });

        return NextResponse.json({ message: 'Notification marked as read' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}
