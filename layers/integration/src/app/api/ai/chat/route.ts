import { NextResponse } from 'next/server';
import { ChatResponse } from '@/types';

// Ini kayaknya ga dipake, tergantung ada fitur chatbot atau tidak

export async function POST(request: Request): Promise<NextResponse<ChatResponse>> {
    try {
        const body = await request.json();
        const { message } = body;

        // This is a placeholder for the AI Chatbot logic.
        // In a real implementation, this would call Gemini and 
        // potentially return structured data for charts.

        return NextResponse.json({
            reply: `I've received your message: "${message}". I can help you analyze your spending or check market sentiment for any token.`,
            charts: [
                { type: 'line', title: 'Spending Trend', data: [10, 20, 15, 30] }
            ]
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Chat service unavailable', reply: '' }, { status: 500 });
    }
}
