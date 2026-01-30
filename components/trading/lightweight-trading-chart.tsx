'use client';

import { useEffect, useRef, memo, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';

interface LightweightTradingChartProps {
  symbol?: string;
  height?: number | string;
  interval?: string;
}

// Map interval to CoinGecko days parameter
// Based on page INTERVALS: '5'=1D, '15'=1W, '30'=1M, 'D'=1Y, 'W'=All
function mapIntervalToDays(interval: string): number | string {
  switch (interval) {
    case '5': return 1;      // 1D - Daily view (1 day)
    case '15': return 7;     // 1W - Weekly view (7 days)
    case '30': return 30;    // 1M - Monthly view (30 days)
    case 'D': return 365;    // 1Y - Yearly view (365 days)
    case 'W': return 'max';  // All time
    default: return 30;
  }
}


// Map ticker to CoinGecko ID
function getCoinGeckoId(symbol: string): string {
  const ticker = symbol.replace(/USDT?$|USD$/i, '').toLowerCase();
  const map: Record<string, string> = {
    btc: 'bitcoin', eth: 'ethereum', sol: 'solana', xrp: 'ripple',
    ada: 'cardano', doge: 'dogecoin', dot: 'polkadot', link: 'chainlink',
    avax: 'avalanche-2', matic: 'matic-network', ltc: 'litecoin',
    uni: 'uniswap', atom: 'cosmos', near: 'near', bch: 'bitcoin-cash',
    xlm: 'stellar', fil: 'filecoin', apt: 'aptos', arb: 'arbitrum',
    op: 'optimism', sui: 'sui', aave: 'aave', mkr: 'maker',
    inj: 'injective-protocol', trx: 'tron', ton: 'the-open-network',
    icp: 'internet-computer', vet: 'vechain', ftm: 'fantom', algo: 'algorand',
    pepe: 'pepe', kas: 'kaspa', sei: 'sei-network',
  };
  return map[ticker] || ticker;
}

function LightweightTradingChartComponent({
  symbol = 'BTC',
  height = 400,
  interval = 'D',
}: LightweightTradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setError(null);

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#707070',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(46, 46, 46, 0.06)' },
        horzLines: { color: 'rgba(46, 46, 46, 0.06)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(46, 46, 46, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(46, 46, 46, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: '#8B5CF6', width: 1, style: 2 },
        horzLine: { color: '#8B5CF6', width: 1, style: 2 },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // Fetch OHLC data
    const fetchData = async () => {
      const days = mapIntervalToDays(interval);
      const coinId = getCoinGeckoId(symbol);

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
        );

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json() as [number, number, number, number, number][];

        // Convert to candlestick format
        const candlestickData: CandlestickData<Time>[] = data.map(([timestamp, open, high, low, close]) => ({
          time: (timestamp / 1000) as Time,
          open,
          high,
          low,
          close,
        }));

        // Create candlestick series
        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#22AB94',
          downColor: '#F7525F',
          borderUpColor: '#22AB94',
          borderDownColor: '#F7525F',
          wickUpColor: '#22AB94',
          wickDownColor: '#F7525F',
        });

        series.setData(candlestickData);
        chart.timeScale().fitContent();
        setIsLoading(false);

      } catch (err) {
        console.error('Chart data error:', err);
        setError('Failed to load chart data');
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, interval]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white" style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Loading chart...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export const LightweightTradingChart = memo(LightweightTradingChartComponent);
