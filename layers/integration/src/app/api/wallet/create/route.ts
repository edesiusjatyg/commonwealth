import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createWalletSchema = z.object({
    userId: z.string(),
    address: z.string().startsWith('0x', 'Invalid wallet address'),
    name: z.string().min(1, 'Wallet name is required'),
    emergencyEmail: z.string().email().optional(),
    dailyLimit: z.number().nonnegative().default(0),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = createWalletSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.errors[0].message },
                { status: 400 }
            );
        }

        const { userId, address, name, emergencyEmail, dailyLimit } = validatedData.data;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Create wallet
        const wallet = await prisma.wallet.create({
            data: {
                userId,
                address,
                name,
                emergencyEmail,
                dailyLimit,
            },
        });

        // Mark user as onboarded
        await prisma.user.update({
            where: { id: userId },
            data: { onboarded: true },
        });

        // Create a first notification
        await prisma.notification.create({
            data: {
                userId,
                title: 'Wallet Created',
                message: `Success! Your wallet "${name}" has been created.`,
                type: 'DEPOSIT_SUCCESS', // Using this as a general success type for now
            },
        });

        return NextResponse.json({
            message: 'Wallet created successfully',
            walletId: wallet.id,
            address: wallet.address
        }, { status: 201 });

    } catch (error: any) {
        console.error('Wallet creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
