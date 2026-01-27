import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotifications, markNotificationRead } from './notifications';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        notification: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('Notifications Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getNotifications', () => {
        it('should return notifications list', async () => {
            const mockNotifications = [
                { id: '1', userId: 'u1', title: 'T1', message: 'M1', type: 'INFO', read: false, createdAt: new Date() },
            ];
            (prisma.notification.findMany as any).mockResolvedValue(mockNotifications);

            const result = await getNotifications({ userId: 'u1' });

            expect(result.notifications).toHaveLength(1);
            expect(result.notifications[0].title).toBe('T1');
        });
    });

    describe('markNotificationRead', () => {
        it('should mark notification as read', async () => {
            (prisma.notification.update as any).mockResolvedValue({});

            const result = await markNotificationRead({ notificationId: 'n1' });

            expect(prisma.notification.update).toHaveBeenCalledWith({
                where: { id: 'n1' },
                data: { read: true },
            });
            expect(result.message).toBe('Notification marked as read');
        });
    });
});
