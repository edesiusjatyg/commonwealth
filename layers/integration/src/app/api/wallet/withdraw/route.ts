import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { WalletResponse } from '@/types';

const withdrawSchema = z.object({
    walletId: z.string(),
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category/Tag is required'),
    password: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse<WalletResponse>> {
    // Check if wallet exists
    // Check for positive amount
    // Check if balance is sufficient
    // Check if daily limit is exceeded (If hits 80% of daily limit, send alert)
    // Check if password is correct
    // Create withdrawal transaction
    // Send notification
    // Return success response

    try {
        const body = await request.json();
        const validatedData = withdrawSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.errors[0].message, message: 'Validation failed' },
                { status: 400 }
            );
        }

        const { walletId, amount, category, password } = validatedData.data;

        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
            include: {
                transactions: true,
                user: true,
            },
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found', message: 'Withdrawal failed' }, { status: 404 });
        }

        const totalDeposits = wallet.transactions
            .filter(t => t.type === 'DEPOSIT' || t.type === 'YIELD')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalWithdrawals = wallet.transactions
            .filter(t => t.type === 'WITHDRAWAL')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const balance = totalDeposits - totalWithdrawals;

        if (amount > balance) {
            return NextResponse.json({ error: 'Insufficient balance', message: 'Withdrawal failed' }, { status: 400 });
        }

        const spendingLimit = Number(wallet.dailyLimit);
        const alreadySpentToday = Number(wallet.spendingToday);
        const newSpendingToday = alreadySpentToday + amount;

        if (spendingLimit > 0 && newSpendingToday > spendingLimit) {
            return NextResponse.json({
                error: 'Daily limit exceeded. Please request approval from emergency contact.',
                message: 'Withdrawal failed'
            }, { status: 403 });
        }

        if (spendingLimit > 0 && newSpendingToday >= spendingLimit * 0.8 && alreadySpentToday < spendingLimit * 0.8) {
            await prisma.notification.create({
                data: {
                    userId: wallet.userId,
                    title: 'Daily Limit Alert',
                    message: `Warning: You have reached 80% of your daily spending limit.`,
                    type: 'DAILY_LIMIT_ALERT',
                },
            });
        }

        const transaction = await prisma.transaction.create({
            data: {
                walletId,
                type: 'WITHDRAWAL',
                amount,
                category,
                description: `Withdrawal to bank`,
            },
        });

        await prisma.wallet.update({
            where: { id: walletId },
            data: { spendingToday: newSpendingToday },
        });

        await prisma.notification.create({
            data: {
                userId: wallet.userId,
                title: 'Withdrawal Successful',
                message: `You have successfully withdrawn USD ${amount} to your bank account.`,
                type: 'WITHDRAWAL_SUCCESS',
            },
        });

        return NextResponse.json({
            message: 'Withdrawal successful',
            walletId: wallet.id,
        });

    } catch (error: any) {
        console.error('Withdrawal error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: 'System error' },
            { status: 500 }
        );
    }
}
