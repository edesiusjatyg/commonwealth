import { NextResponse } from 'next/server';

export async function POST() {
    // In a real app with cookies, you would clear them here
    return NextResponse.json({ message: 'Logout successful' });
}
