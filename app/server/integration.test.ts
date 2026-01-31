import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { register } from './auth';
import { createWallet, deposit, withdraw } from './wallet';
import { prisma } from '@/lib/prisma';

// integration test using real DB
describe('Backend Integration Flow', () => {
    const uniqueId = Date.now();
    const email = `int_test_${uniqueId}@example.com`;
    let userId: string;
    let walletId: string;

    beforeAll(async () => {
        // Ensure DB connection
        await prisma.$connect();
    });

    afterAll(async () => {
        // Cleanup
        if (userId) {
            // Clean up related data first due to FKs
            if (walletId) {
                await prisma.transaction.deleteMany({ where: { walletId } });
                await prisma.yieldHistory.deleteMany({ where: { walletId } });
                await prisma.wallet.deleteMany({ where: { id: walletId } });
            }
            await prisma.notification.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        }
        await prisma.$disconnect();
    });

    it('should register a new user', async () => {
        const result = await register({
            email,
            password: 'password123',
        });

        expect(result.message).toBe('User registered successfully');
        expect(result.userId).toBeDefined();
        userId = result.userId!;
    });

    it('should create a wallet for the user', async () => {
        const result = await createWallet({
            userId,
            name: 'Integration Wallet',
            dailyLimit: 500,
            emergencyContacts: [
                { email: 'emergency1@example.com', name: 'Contact 1' },
                { email: 'emergency2@example.com', name: 'Contact 2' },
            ],
        });

        expect(result.message).toBe('Wallet created successfully');
        expect(result.walletId).toBeDefined();
        walletId = result.walletId!;
    });

    it('should deposit funds', async () => {
        const result = await deposit({
            walletId,
            amount: 200,
            category: 'Integration'
        });

        expect(result.message).toBe('Deposit successful');

        // Verify via Prisma
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
            include: { transactions: true }
        });
        const depositTx = wallet?.transactions.find(t => t.type === 'DEPOSIT');
        expect(Number(depositTx?.amount)).toBe(200);
    });

    it('should withdraw funds', async () => {
        const result = await withdraw({
            walletId,
            amount: 50,
            category: 'Integration Expense'
        });

        expect(result.message).toBe('Withdrawal successful');

        // Verify balance indirectly or via transaction
        const wallet = await prisma.wallet.findUnique({
            where: { id: walletId },
            include: { transactions: true }
        });
        const withdrawTx = wallet?.transactions.find(t => t.type === 'WITHDRAWAL');
        expect(Number(withdrawTx?.amount)).toBe(50);
        expect(Number(wallet?.spendingToday)).toBe(50);
    });
});
