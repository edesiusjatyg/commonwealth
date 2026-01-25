import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { WalletResponse } from '@/types';

const approvalSchema = z.object({
    walletId: z.string(),
    approvalCode: z.string(),
});

export async function POST(request: Request): Promise<NextResponse<WalletResponse>> {
    // Check if wallet exists
    // Check if approval code is valid
    // Unlimited daily limit for today
    // Send notification
    // Return success response 

    try {
        const body = await request.json();
        const validatedData = approvalSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ error: validatedData.error.errors[0].message, message: 'Validation failed' }, { status: 400 });
        }

        const { walletId, approvalCode } = validatedData.data;

        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
        });

        if (!wallet) return NextResponse.json({ error: 'Wallet not found', message: 'Approval failed' }, { status: 404 });

        if (approvalCode !== '9999') {
            return NextResponse.json({ error: 'Invalid approval code', message: 'Approval failed' }, { status: 403 });
        }

        await prisma.wallet.update({
            where: { id: walletId },
            data: { dailyLimit: wallet.dailyLimit },
        });

        await prisma.notification.create({
            data: {
                userId: wallet.userId,
                title: 'Daily Limit Override Approved',
                message: 'Your emergency contact has approved your daily limit override. Your limit has been reset for today.',
                type: 'EMERGENCY_APPROVAL',
            },
        });

        return NextResponse.json({ message: 'Daily limit override approved', walletId: wallet.id });

    } catch (error: any) {
        console.error('Approval error:', error);
        return NextResponse.json({ error: 'Internal server error', message: 'System error' }, { status: 500 });
    }
}
