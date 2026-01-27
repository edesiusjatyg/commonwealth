import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import "dotenv/config";

async function main() {
    try {
        console.log('Initializing Prisma for seeding...');
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error("DATABASE_URL is not set");
        }

        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        console.log('Connecting...');
        await prisma.$connect();

        // 1. Create User
        const email = `seed_${Date.now()}@example.com`;
        console.log(`Creating User (${email})...`);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: 'hash123',
                eoaAddress: `0xUser${Date.now()}`,
                onboarded: true
            }
        });

        // 2. Create Wallet
        console.log('Creating Wallet...');
        const wallet = await prisma.wallet.create({
            data: {
                userId: user.id,
                address: `0xWallet${Date.now()}`,
                name: 'Seed Wallet',
                dailyLimit: 1000,
                spendingToday: 0
            }
        });

        // 3. Create Transaction
        console.log('Creating Transaction...');
        await prisma.transaction.create({
            data: {
                walletId: wallet.id,
                type: 'DEPOSIT',
                amount: 100,
                category: 'Seed',
                description: 'Initial seed deposit'
            }
        });

        // 4. Create YieldHistory
        console.log('Creating YieldHistory...');
        await prisma.yieldHistory.create({
            data: {
                walletId: wallet.id,
                amount: 0.5
            }
        });

        // 5. Create Notification
        console.log('Creating Notification...');
        await prisma.notification.create({
            data: {
                userId: user.id,
                title: 'Welcome',
                message: 'Account created via seed',
                type: 'DEPOSIT_SUCCESS'
                // Schema has specific types: DAILY_LIMIT_ALERT, DEPOSIT_SUCCESS, etc.
                // Let's use DEPOSIT_SUCCESS
                // type: 'DEPOSIT_SUCCESS' 
            } as any
        });

        // Correction on Notification Type based on schema
        // enum NotificationType { DAILY_LIMIT_ALERT, DEPOSIT_SUCCESS ... }
        // I should use a valid one.

        // Let's re-run with valid enum usage or cast if needed, but string usually works if matches.
        // I will write the file with 'DEPOSIT_SUCCESS'.

        console.log('✅ Specific data seeded successfully!');

        await prisma.$disconnect();
        await pool.end();

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();
