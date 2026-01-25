import { NextResponse } from 'next/server';
import axios from 'axios';

const INSIGHTS_SERVICE_URL = process.env.USER_INSIGHTS_SERVICE_URL || 'http://localhost:8001';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, transactionsData } = body;

        const response = await axios.post(`${INSIGHTS_SERVICE_URL}/insights/generate`, {
            transactions_data: transactionsData
        }, {
            params: { user_id: userId }
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('AI Insight proxy error:', error.message);
        return NextResponse.json(
            { error: 'AI Insights Service unreachable' },
            { status: 502 }
        );
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    try {
        const response = await axios.get(`${INSIGHTS_SERVICE_URL}/insights/${userId}`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }
}
