import { NextRequest, NextResponse } from 'next/server';
import { TRADING_CONFIG, getZeroXApiKey, getChainId } from '../config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const takerAddress = searchParams.get('takerAddress');
    const chainId = searchParams.get('chainId') || String(getChainId());
    
    // Validate required parameters
    if (!sellToken || !buyToken || !sellAmount) {
      return NextResponse.json(
        { error: 'Missing required parameters: sellToken, buyToken, sellAmount' },
        { status: 400 }
      );
    }
    
    // Build 0x API request
    const params = new URLSearchParams({
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      ...(takerAddress && { taker: takerAddress }),
      slippageBps: String(TRADING_CONFIG.DEFAULT_SLIPPAGE_BPS),
    });
    
    const apiUrl = `${TRADING_CONFIG.ZERO_X_API_URL}/swap/allowance-holder/quote?${params}`;
    
    // Call 0x API
    const response = await fetch(apiUrl, {
      headers: {
        '0x-api-key': getZeroXApiKey(),
        '0x-version': TRADING_CONFIG.ZERO_X_API_VERSION,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('0x API Error:', errorData);
      
      return NextResponse.json(
        { 
          error: '0x API request failed',
          details: errorData,
          status: response.status 
        },
        { status: response.status }
      );
    }
    
    const quoteData = await response.json();
    
    // Return quote data
    return NextResponse.json({
      success: true,
      quote: quoteData,
      timestamp: Date.now(),
    });
    
  } catch (error) {
    console.error('Quote API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch quote',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
