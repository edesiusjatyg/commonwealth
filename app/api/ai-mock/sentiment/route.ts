import { NextRequest, NextResponse } from 'next/server';

// Mock AI sentiment responses
const sentiments: Record<string, string> = {
  BTC: "Bitcoin shows strong bullish momentum with institutional buying pressure continuing. Technical indicators suggest potential resistance at $70K. Market sentiment remains optimistic with high trading volumes.",
  ETH: "Ethereum demonstrates solid upward trajectory following recent network upgrades. On-chain metrics indicate growing DeFi activity. Short-term volatility expected but overall trend remains positive.",
  USDC:  "USDC maintains stable 1:1 peg with USD. High liquidity across major exchanges. Preferred stablecoin for trading pairs with minimal volatility. Safe haven during market corrections.",
  DEFAULT: "Market analysis shows moderate volatility with mixed sentiment. Traders should monitor key support and resistance levels. Volume indicates active participation across timeframes."
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crypto = searchParams.get('crypto')?.toUpperCase() || 'DEFAULT';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const sentiment = sentiments[crypto] || sentiments.DEFAULT;
    
    return NextResponse.json({
      success: true,
      sentiment,
      crypto,
timestamp: Date.now(),
    });
    
  } catch (error) {
    console.error('AI Sentiment Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sentiment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
