import { prisma } from '@/lib/prisma';
import { AuthResponse } from '@/types';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().optional(),
    baseSocialId: z.string().optional(),
}).refine(data => (data.email && data.password) || data.baseSocialId, {
    message: "Either email/password or Base Social ID must be provided",
});

export async function POST(request: Request): Promise<NextResponse<AuthResponse>> {
    try {
        const body = await request.json();
        const validatedData = loginSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: z.treeifyError(validatedData.error).errors[0], message: 'Validation failed' },
                { status: 400 }
            );
        }

        const { email, password, baseSocialId } = validatedData.data;

        let user = null;
        if (baseSocialId) {
            user = await prisma.user.findUnique({
                where: { baseSocialId },
            });
        } else if (email && password) {
            user = await prisma.user.findUnique({
                where: { email },
            });

            if (user && user.passwordHash) {
                const passwordMatch = await bcrypt.compare(password, user.passwordHash);
                if (!passwordMatch) {
                    user = null;
                }
            } else {
                user = null;
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials', message: 'Login failed' },
                { status: 401 }
            );
        }

        // Set cookie/token here okok
        return NextResponse.json({
            message: 'Login successful',
            userId: user.id,
            onboarded: user.onboarded
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: 'System error' },
            { status: 500 }
        );
    }
}
