import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExpenses } from './expenses';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        transaction: {
            findMany: vi.fn(),
        },
    },
}));

describe('Expenses Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getExpenses', () => {
        it('should calculate balance and totals correctly', async () => {
            const mockTransactions = [
                { id: 't1', type: 'DEPOSIT', amount: 100, createdAt: new Date() },
                { id: 't2', type: 'WITHDRAWAL', amount: 30, createdAt: new Date() },
                { id: 't3', type: 'YIELD', amount: 10, createdAt: new Date() },
            ];
            (prisma.transaction.findMany as any).mockResolvedValue(mockTransactions);

            const result = await getExpenses({ walletId: 'w1' });

            expect(result.balance).toBe(80); // 100 + 10 - 30
            expect(result.totalDeposits).toBe(110);
            expect(result.totalWithdrawals).toBe(30);
            expect(result.history).toHaveLength(3);
        });

        it('should return empty values if no transactions', async () => {
            (prisma.transaction.findMany as any).mockResolvedValue([]);

            const result = await getExpenses({ walletId: 'w1' });

            expect(result.balance).toBe(0);
        });
    });
});
