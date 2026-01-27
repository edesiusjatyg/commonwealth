import { NextResponse } from 'next/server';
import { TRADING_CONFIG, getChainId, getTokenAddress } from '../config';

export async function GET() {
  try {
    const chainId = getChainId();
    const isMainnet = chainId === TRADING_CONFIG.CHAIN_IDS.BASE_MAINNET;
    
    // Build token list based on current chain
    const tokens = TRADING_CONFIG.POPULAR_TOKENS.map((token) => {
      try {
        const address = getTokenAddress(token.symbol, chainId);
        
        return {
          ...token,
          address,
          chainId,
          network: isMainnet ? 'Base Mainnet' : 'Base Sepolia',
        };
      } catch (error) {
        console.warn(`Token ${token.symbol} not available on chain ${chainId}`);
        return null;
      }
    }).filter(Boolean);
    
    return NextResponse.json({
      success: true,
      tokens,
      chainId,
      network: isMainnet ? 'mainnet' : 'sepolia',
    });
    
  } catch (error) {
    console.error('Tokens API Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch tokens',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
