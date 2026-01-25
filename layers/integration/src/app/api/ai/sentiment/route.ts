import { NextResponse } from 'next/server';
import axios from 'axios';

const SENTIMENT_SERVICE_URL = process.env.MARKET_SENTIMENT_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, timeframe } = body;

        const response = await axios.post(`${SENTIMENT_SERVICE_URL}/api/v1/sentiment`, {
            token,
            timeframe: timeframe || '3d'
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('AI Sentiment proxy error:', error.message);
        return NextResponse.json(
            { error: 'Market Sentiment Service unreachable' },
            { status: 502 }
        );
    }
}
