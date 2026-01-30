'use client';

import { useEffect, useRef, memo, useState } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  height?: number | string;
  theme?: 'light' | 'dark';
  interval?: string;
}

const INTERVAL_MAP: Record<string, string> = {
  '5': '5',      // 5 minute - for daily view
  '15': '15',    // 15 minute - for weekly view
  '30': '30',    // 30 minute - for monthly view
  'D': 'D',      // Daily - for yearly view
  'W': 'W',      // Weekly - for all-time view
  // Legacy support
  '1H': '60',
  '4H': '240',
  '1D': 'D',
  '1W': 'W',
  '1M': 'M',
};

function TradingViewChartComponent({
  symbol = 'BINANCE:BTCUSDT',
  height = 400,
  theme = 'light',
  interval = 'D',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';
    setIsLoaded(false);

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    // Map interval to TradingView format
    const tvInterval = INTERVAL_MAP[interval] || interval;

    // Create and inject script for Advanced Chart widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      interval: tvInterval,
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1', // Candlestick
      locale: 'en',
      allow_symbol_change: false,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: true,
      hide_legend: true,
      hide_volume: true,
      hotlist: false,
      save_image: false,
      withdateranges: false,
      support_host: 'https://www.tradingview.com',
      backgroundColor: '#ffffff',
      gridColor: 'rgba(46, 46, 46, 0.06)',
      autosize: true,
    });

    script.onload = () => setIsLoaded(true);
    
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval]);

  return (
    <div className="relative" style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading chart...</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
