import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletId = searchParams.get('walletId');

        if (!walletId) {
            return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
        }

        const transactions = await prisma.transaction.findMany({
            where: { walletId },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate Summary stats
        const totalDeposits = transactions
            .filter(t => t.type === 'DEPOSIT' || t.type === 'YIELD')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalWithdrawals = transactions
            .filter(t => t.type === 'WITHDRAWAL')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return NextResponse.json({
            balance: totalDeposits - totalWithdrawals,
            history: transactions,
            totalDeposits,
            totalWithdrawals
        });

    } catch (error: any) {
        console.error('Expenses error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
