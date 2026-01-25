import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    baseSocialId: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = registerSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, password, baseSocialId } = validatedData.data;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Check if baseSocialId already exists
        if (baseSocialId) {
            const existingSocialUser = await prisma.user.findUnique({
                where: { baseSocialId },
            });

            if (existingSocialUser) {
                return NextResponse.json(
                    { error: 'Social account already registered' },
                    { status: 400 }
                );
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                baseSocialId,
            },
        });

        return NextResponse.json(
            { message: 'User registered successfully', userId: user.id },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
