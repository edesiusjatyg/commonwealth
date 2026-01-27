import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOnboardingSteps, completeOnboarding } from './onboarding';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            update: vi.fn(),
        },
    },
}));

describe('Onboarding Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getOnboardingSteps', () => {
        it('should return static steps', async () => {
            const result = await getOnboardingSteps();
            expect(result.steps).toHaveLength(3);
            expect(result.steps[0].title).toBe('Welcome to Blackwallet');
        });
    });

    describe('completeOnboarding', () => {
        it('should update user status', async () => {
            (prisma.user.update as any).mockResolvedValue({ id: 'u1', onboarded: true });

            const result = await completeOnboarding('u1');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { onboarded: true },
            });
            expect(result).toBe(true);
        });
    });
});
