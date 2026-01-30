'use client';

import { useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';

interface TradingViewWatchlistProps {
  height?: number | string;
  theme?: 'light' | 'dark';
}

// Crypto symbols for the watchlist
const CRYPTO_SYMBOLS = [
  { s: 'BINANCE:BTCUSDT', d: 'Bitcoin' },
  { s: 'BINANCE:ETHUSDT', d: 'Ethereum' },
  { s: 'BINANCE:SOLUSDT', d: 'Solana' },
  { s: 'BINANCE:BNBUSDT', d: 'BNB' },
  { s: 'BINANCE:ADAUSDT', d: 'Cardano' },
  { s: 'BINANCE:XRPUSDT', d: 'XRP' },
  { s: 'BINANCE:DOTUSDT', d: 'Polkadot' },
  { s: 'BINANCE:DOGEUSDT', d: 'Dogecoin' },
  { s: 'BINANCE:AVAXUSDT', d: 'Avalanche' },
  { s: 'BINANCE:MATICUSDT', d: 'Polygon' },
  { s: 'BINANCE:LINKUSDT', d: 'Chainlink' },
  { s: 'BINANCE:UNIUSDT', d: 'Uniswap' },
  { s: 'BINANCE:ATOMUSDT', d: 'Cosmos' },
  { s: 'BINANCE:LTCUSDT', d: 'Litecoin' },
  { s: 'BINANCE:NEARUSDT', d: 'NEAR' },
];

function TradingViewWatchlistComponent({
  height = 500,
  theme = 'dark',
}: TradingViewWatchlistProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    // Create and inject script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      dateRange: '1D',
      showChart: true,
      locale: 'en',
      width: '100%',
      height: '100%',
      largeChartUrl: '',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: 'rgba(41, 191, 87, 1)',
      plotLineColorFalling: 'rgba(255, 77, 77, 1)',
      gridLineColor: 'rgba(240, 243, 250, 0.1)',
      scaleFontColor: 'rgba(140, 140, 150, 1)',
      belowLineFillColorGrowing: 'rgba(41, 191, 87, 0.12)',
      belowLineFillColorFalling: 'rgba(255, 77, 77, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(41, 191, 87, 0)',
      belowLineFillColorFallingBottom: 'rgba(255, 77, 77, 0)',
      symbolActiveColor: 'rgba(41, 191, 87, 0.12)',
      tabs: [
        {
          title: 'Crypto',
          symbols: CRYPTO_SYMBOLS,
          originalTitle: 'Crypto',
        },
      ],
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    // Add click listener for navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicking on a symbol row
      const symbolRow = target.closest('[data-symbol]');
      if (symbolRow) {
        const symbol = symbolRow.getAttribute('data-symbol');
        if (symbol) {
          const coinSymbol = symbol.replace('BINANCE:', '').replace('USDT', '').toLowerCase();
          router.push(`/trading/${coinSymbol}`);
        }
      }
    };

    containerRef.current.addEventListener('click', handleClick);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
        containerRef.current.innerHTML = '';
      }
    };
  }, [theme, router]);

  return (
    <div
      ref={containerRef}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
    />
  );
}

export const TradingViewWatchlist = memo(TradingViewWatchlistComponent);
