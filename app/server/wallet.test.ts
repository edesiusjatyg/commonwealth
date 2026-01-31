import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWallet, deposit, withdraw } from "./wallet"; // adjust path if needed
import { prisma } from "@/lib/prisma";
import { computeWalletAddress, deployWalletOnChain } from "./chain";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		wallet: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		notification: {
			create: vi.fn(),
		},
		transaction: {
			create: vi.fn(),
		},
	},
}));

vi.mock("./chain", () => ({
	computeWalletAddress: vi.fn(),
	deployWalletOnChain: vi.fn(),
}));

describe('Wallet Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createWallet', () => {
        it('should create a wallet successfully when user exists', async () => {
            const mockUser = { id: 'u1', eoaAddress: '0x123', onboarded: false };
            const mockComputedAddress = '0xWalletAddr';
            const mockWallet = { id: 'w1', address: mockComputedAddress, name: 'My Wallet' };

            (prisma.user.findUnique as any).mockResolvedValue(mockUser);
            (computeWalletAddress as any).mockResolvedValue(mockComputedAddress);
            (deployWalletOnChain as any).mockResolvedValue('0xtxhash');
            (prisma.wallet.create as any).mockResolvedValue(mockWallet);

            const input = {
                userId: 'u1',
                name: 'My Wallet',
                dailyLimit: 100,
                emergencyContacts: [
                    { email: 'emergency1@example.com', name: 'Contact 1' },
                    { email: 'emergency2@example.com', name: 'Contact 2' },
                ],
            };

            const result = await createWallet(input);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
            expect(computeWalletAddress).toHaveBeenCalled();
            expect(deployWalletOnChain).toHaveBeenCalled();
            expect(prisma.wallet.create).toHaveBeenCalled();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { onboarded: true },
            });
            expect(result).toEqual({
                message: 'Wallet created successfully',
                walletId: 'w1',
                address: mockComputedAddress,
            });
        });

        it('should return error if user EOA not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', eoaAddress: null });

            const result = await createWallet({ 
                userId: 'u1', 
                name: 'My Wallet', 
                dailyLimit: 0,
                emergencyContacts: [
                    { email: 'emergency1@example.com', name: 'Contact 1' },
                    { email: 'emergency2@example.com', name: 'Contact 2' },
                ],
            });

            expect(result).toEqual({
                error: 'User EOA not found',
                message: 'Wallet creation failed',
            });
            expect(prisma.wallet.create).not.toHaveBeenCalled();
        });
    });

    describe('deposit', () => {
        it('should deposit successfully', async () => {
            const mockWallet = { id: 'w1', userId: 'u1', name: 'My Wallet' };
            (prisma.wallet.findUnique as any).mockResolvedValue(mockWallet);

            const input = {
                walletId: 'w1',
                amount: 50,
                category: 'Topup',
            };

            const result = await deposit(input);

            expect(prisma.transaction.create).toHaveBeenCalledWith({
                data: {
                    walletId: 'w1',
                    type: 'DEPOSIT',
                    amount: 50,
                    category: 'Topup',
                    description: 'Deposit to wallet My Wallet',
                },
            });
            expect(prisma.notification.create).toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Deposit successful',
                walletId: 'w1',
            });
        });

        it('should return error if wallet not found', async () => {
            (prisma.wallet.findUnique as any).mockResolvedValue(null);

            const result = await deposit({ walletId: 'w1', amount: 50, category: 'Topup' });

            expect(result.error).toBe('Wallet not found');
        });
    });

    describe('withdraw', () => {
        const mockWalletWithFunds = {
            id: 'w1',
            userId: 'u1',
            dailyLimit: 1000,
            spendingToday: 0,
            transactions: [
                { type: 'DEPOSIT', amount: 100 },
            ],
        };

        it('should withdraw successfully if balance suffices', async () => {
            (prisma.wallet.findUnique as any).mockResolvedValue(mockWalletWithFunds);

            const result = await withdraw({
                walletId: 'w1',
                amount: 50,
                category: 'Expense',
            });

            expect(prisma.transaction.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    type: 'WITHDRAWAL',
                    amount: 50,
                })
            });
            expect(prisma.wallet.update).toHaveBeenCalledWith({
                where: { id: 'w1' },
                data: { spendingToday: 50 },
            });
            expect(result.message).toBe('Withdrawal successful');
        });

        it('should return error if insufficient balance', async () => {
            (prisma.wallet.findUnique as any).mockResolvedValue(mockWalletWithFunds);

            // Balance is 100
            const result = await withdraw({
                walletId: 'w1',
                amount: 150,
                category: 'Expense',
            });

            expect(result.error).toBe('Insufficient balance');
            expect(prisma.transaction.create).not.toHaveBeenCalled();
        });
    });
});
