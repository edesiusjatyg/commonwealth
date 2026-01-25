import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const depositSchema = z.object({
    walletId: z.string(),
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category/Tag is required'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = depositSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.errors[0].message },
                { status: 400 }
            );
        }

        const { walletId, amount, category } = validatedData.data;

        // Check if wallet exists
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
            include: { user: true },
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                walletId,
                type: 'DEPOSIT',
                amount: amount,
                category,
                description: `Deposit to wallet ${wallet.name}`,
            },
        });

        // Send notification
        await prisma.notification.create({
            data: {
                userId: wallet.userId,
                title: 'Deposit Successful',
                message: `You have successfully deposited USD ${amount} to your wallet.`,
                type: 'DEPOSIT_SUCCESS',
            },
        });

        return NextResponse.json({
            message: 'Deposit successful',
            transactionId: transaction.id,
            amount: transaction.amount,
        });

    } catch (error: any) {
        console.error('Deposit error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
