import { NextRequest, NextResponse } from 'next/server';

// Valid timeframes for the sentiment microservice
const VALID_TIMEFRAMES = ['1d', '7d', '30d', '365d'] as const;
type Timeframe = typeof VALID_TIMEFRAMES[number];

// Map common timeframe formats to microservice format
function normalizeTimeframe(tf: string): Timeframe {
  const normalized = tf.toLowerCase().replace(/\s+/g, '');
  if (normalized === '24h' || normalized === '1day' || normalized === '1d') return '1d';
  if (normalized === '7d' || normalized === '1w' || normalized === '1week') return '7d';
  if (normalized === '30d' || normalized === '1m' || normalized === '1month') return '30d';
  if (normalized === '365d' || normalized === '1y' || normalized === '1year') return '365d';
  return '1d'; // Default
}

// Proxy to sentiment microservice on port 8000
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, timeframe = '1d' } = body;

    // Call sentiment microservice
    const sentimentResponse = await fetch('http://localhost:8000/api/v1/sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token.toUpperCase(),
        timeframe: normalizeTimeframe(timeframe),
      }),
    });

    if (!sentimentResponse.ok) {
      const errorData = await sentimentResponse.json().catch(() => ({}));
      console.error('Sentiment service error:', errorData);
      throw new Error(`Sentiment service returned ${sentimentResponse.status}`);
    }

    const data = await sentimentResponse.json();
    
    return NextResponse.json({
      success: true,
      sentiment: data.sentiment,
      confidence: data.confidence,
      summary: data.summary,
      sources: data.cited_sources || [],
    });

  } catch (error) {
    console.error('Sentiment API Error:', error);
    
    // Return fallback sentiment
    return NextResponse.json({
      success: true,
      sentiment: 'neutral',
      confidence: 0,
      summary: 'Market sentiment analysis temporarily unavailable. Please check back shortly.',
      sources: [],
    });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('crypto') || searchParams.get('token') || 'BTC';
  const timeframe = searchParams.get('timeframe') || '1d';
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, timeframe }),
  }));
}

