import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const approvalSchema = z.object({
    walletId: z.string(),
    approvalCode: z.string(), // Simulating a code sent to emergency contact
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = approvalSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ error: validatedData.error.errors[0].message }, { status: 400 });
        }

        const { walletId, approvalCode } = validatedData.data;

        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
        });

        if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

        // Simulate validation of approvalCode
        if (approvalCode !== '9999') {
            return NextResponse.json({ error: 'Invalid approval code' }, { status: 403 });
        }

        // Reset spending today
        await prisma.wallet.update({
            where: { id: walletId },
            data: { spendingToday: 0 },
        });

        // Send Notification
        await prisma.notification.create({
            data: {
                userId: wallet.userId,
                title: 'Daily Limit Override Approved',
                message: 'Your emergency contact has approved your daily limit override. Your limit has been reset for today.',
                type: 'EMERGENCY_APPROVAL',
            },
        });

        return NextResponse.json({ message: 'Daily limit override approved' });

    } catch (error: any) {
        console.error('Approval error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
