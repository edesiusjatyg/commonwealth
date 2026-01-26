import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BalanceResponse, TransactionRecord } from '@/types';

export async function GET(request: Request): Promise<NextResponse<BalanceResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const walletId = searchParams.get('walletId');

        if (!walletId) {
            return NextResponse.json({ error: 'Wallet ID is required', balance: 0, history: [], totalDeposits: 0, totalWithdrawals: 0 }, { status: 400 });
        }

        const transactions = await prisma.transaction.findMany({
            where: { walletId },
            orderBy: { createdAt: 'desc' },
        });

        const totalDeposits = transactions
            .filter(t => t.type === 'DEPOSIT' || t.type === 'YIELD')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalWithdrawals = transactions
            .filter(t => t.type === 'WITHDRAWAL')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const history: TransactionRecord[] = transactions.map(t => ({
            id: t.id,
            walletId: t.walletId,
            type: t.type,
            amount: Number(t.amount),
            category: t.category,
            description: t.description,
            createdAt: t.createdAt,
        }));

        return NextResponse.json({
            balance: totalDeposits - totalWithdrawals,
            history,
            totalDeposits,
            totalWithdrawals
        });

    } catch (error: any) {
        console.error('Expenses error:', error);
        return NextResponse.json(
            { error: 'Internal server error', balance: 0, history: [], totalDeposits: 0, totalWithdrawals: 0 },
            { status: 500 }
        );
    }
}
