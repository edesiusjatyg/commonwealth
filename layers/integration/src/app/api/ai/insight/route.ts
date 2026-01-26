import { NextResponse } from 'next/server';
import axios from 'axios';
import { InsightResponse } from '@/types';

const INSIGHTS_SERVICE_URL = process.env.USER_INSIGHTS_SERVICE_URL || 'http://localhost:8001';

export async function POST(request: Request): Promise<NextResponse<InsightResponse>> {
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
            { error: 'AI Insights Service unreachable', insight_text: '', confidence: 0 },
            { status: 502 }
        );
    }
}

export async function GET(request: Request): Promise<NextResponse<InsightResponse>> {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required', insight_text: '', confidence: 0 }, { status: 400 });
    }

    try {
        const response = await axios.get(`${INSIGHTS_SERVICE_URL}/insights/${userId}`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Insight not found', insight_text: '', confidence: 0 }, { status: 404 });
    }
}
