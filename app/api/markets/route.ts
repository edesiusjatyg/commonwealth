import { NextRequest, NextResponse } from 'next/server';
import { cmcService, type CMCCoinInfo } from '@/lib/services/coinmarketcap';

export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '100');
  const sort = searchParams.get('sort') || 'market_cap'; // market_cap, gainers, losers
  
  try {
    const cryptos = await cmcService.getTopCryptos(limit);
    
    if (!cryptos || cryptos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data available. Check CMC API key.',
        data: [],
      });
    }

    // Transform and sort data
    let markets = cryptos.map((coin: CMCCoinInfo) => ({
      id: coin.id,
      rank: coin.cmc_rank,
      symbol: coin.symbol,
      name: coin.name,
      slug: coin.slug,
      price: coin.quote.USD.price,
      change1h: coin.quote.USD.percent_change_1h,
      change24h: coin.quote.USD.percent_change_24h,
      change7d: coin.quote.USD.percent_change_7d,
      marketCap: coin.quote.USD.market_cap,
      volume24h: coin.quote.USD.volume_24h,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      // CMC logo URL pattern
      logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
    }));

    // Apply sorting
    if (sort === 'gainers') {
      markets = markets.sort((a, b) => b.change24h - a.change24h);
    } else if (sort === 'losers') {
      markets = markets.sort((a, b) => a.change24h - b.change24h);
    } else if (sort === 'volume') {
      markets = markets.sort((a, b) => b.volume24h - a.volume24h);
    }
    // Default already sorted by market cap from CMC

    return NextResponse.json({
      success: true,
      data: markets,
      meta: {
        total: markets.length,
        sort,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
