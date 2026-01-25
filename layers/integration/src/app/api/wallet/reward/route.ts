import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const rewardSchema = z.object({
    walletId: z.string(),
    amount: z.number().positive(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = rewardSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ error: validatedData.error.errors[0].message }, { status: 400 });
        }

        const { walletId, amount } = validatedData.data;

        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
        });

        if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

        // Create Yield Transaction
        await prisma.transaction.create({
            data: {
                walletId,
                type: 'YIELD',
                amount,
                category: 'REWARD',
                description: 'Weekly staking reward',
            },
        });

        // Send Notification
        await prisma.notification.create({
            data: {
                userId: wallet.userId,
                title: 'Reward Received!',
                message: `Your wallet just received a weekly yield of USD ${amount}.`,
                type: 'REWARD_RECEIVED',
            },
        });

        return NextResponse.json({ message: 'Reward processed successfully', amount });

    } catch (error: any) {
        console.error('Reward error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
