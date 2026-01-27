import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, logout, register } from './auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn(),
    },
}));

const mockCookies = {
    set: vi.fn(),
    delete: vi.fn(),
};
vi.mock('next/headers', () => ({
    cookies: vi.fn(() => mockCookies),
}));

// Mock chain generation
vi.mock('./chain', () => ({
    generateAccount: vi.fn(() => ({ privateKey: 'pk', address: '0xaddr' })),
}));

describe('Auth Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should login successfully with password', async () => {
            const mockUser = { id: 'u1', passwordHash: 'hash', onboarded: true };
            (prisma.user.findUnique as any).mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(true);

            const result = await login({ email: 'test@test.com', password: 'password' });

            expect(prisma.user.findUnique).toHaveBeenCalled();
            expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash');
            expect(mockCookies.set).toHaveBeenCalled();
            expect(result.message).toBe('Login successful');
            expect(result.userId).toBe('u1');
        });

        it('should return error on invalid credentials', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);

            const result = await login({ email: 'test@test.com', password: 'password' });

            expect(result.error).toBe('Invalid credentials');
        });
    });

    describe('logout', () => {
        it('should delete session cookie', async () => {
            const result = await logout();
            expect(mockCookies.delete).toHaveBeenCalledWith('session');
            expect(result.message).toBe('Logout successful');
        });
    });

    describe('register', () => {
        it('should register new user', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null); // No existing user
            (bcrypt.hash as any).mockResolvedValue('newhash');
            (prisma.user.create as any).mockResolvedValue({ id: 'u2' });

            const result = await register({ email: 'new@test.com', password: 'password123' });

            expect(prisma.user.create).toHaveBeenCalled();
            expect(result.message).toBe('User registered successfully');
            expect(result.userId).toBe('u2');
        });

        it('should fail if email exists', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' });

            const result = await register({ email: 'exist@test.com', password: 'password123' });

            expect(result.error).toBe('Email already registered');
        });
    });
});
