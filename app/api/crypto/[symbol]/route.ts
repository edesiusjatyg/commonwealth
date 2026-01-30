import { NextRequest, NextResponse } from 'next/server';
import { cmcService } from '@/lib/services/coinmarketcap';

interface RouteParams {
  params: Promise<{ symbol: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Await params in Next.js 16
  const { symbol } = await params;

  try {
    // Get both price info and metadata
    const [coinInfo, metadata] = await Promise.all([
      cmcService.getCoinInfo(symbol),
      cmcService.getMetadata(symbol),
    ]);

    if (!coinInfo && !metadata) {
      return NextResponse.json(
        { error: 'Coin not found or API key missing' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        // Basic info
        name: coinInfo?.name || metadata?.name || symbol.toUpperCase(),
        symbol: symbol.toUpperCase(),
        rank: coinInfo?.cmc_rank,
        
        // Price data
        price: coinInfo?.quote?.USD?.price,
        change24h: coinInfo?.quote?.USD?.percent_change_24h,
        change7d: coinInfo?.quote?.USD?.percent_change_7d,
        marketCap: coinInfo?.quote?.USD?.market_cap,
        volume24h: coinInfo?.quote?.USD?.volume_24h,
        
        // Supply
        circulatingSupply: coinInfo?.circulating_supply,
        totalSupply: coinInfo?.total_supply,
        maxSupply: coinInfo?.max_supply,
        
        // Metadata
        description: metadata?.description,
        logo: metadata?.logo,
        website: metadata?.urls?.website?.[0],
        twitter: metadata?.urls?.twitter?.[0],
      },
    });
  } catch (error) {
    console.error('Crypto API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto data' },
      { status: 500 }
    );
  }
}
