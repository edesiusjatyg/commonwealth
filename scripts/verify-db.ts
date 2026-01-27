import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import "dotenv/config";

async function main() {
    try {
        console.log('Initializing Prisma with pg adapter...');
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error("DATABASE_URL is not set in environment");
        }

        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Successfully connected to the database.');

        // Simple query to verify
        const result = await prisma.$queryRaw`SELECT 1 + 1 as result`;
        console.log('Test query result:', result);

        console.log('✅ Database connection verified!');

        await prisma.$disconnect();
        await pool.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

main();
