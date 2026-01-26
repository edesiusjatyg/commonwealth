import { NextResponse } from 'next/server';
import { AuthResponse } from '@/types';

// WIP

export async function POST(): Promise<NextResponse<AuthResponse>> {
    return NextResponse.json({ message: 'Logout successful' });
}
