'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Share2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { TradingViewChart } from '@/components/trading/tradingview-chart';
import { AISentimentCard } from '@/components/trading/ai-sentiment-card';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

interface CoinData {
  name: string;
  symbol: string;
  rank: number;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  description: string;
  logo: string;
  website: string;
}

// Interval mapping based on user request:
// 5 for daily, 15 for weekly, 30 for monthly, D for year, W for all time
const INTERVALS = [
  { label: '1D', value: '5', sentimentTf: '1d', description: 'Daily' },
  { label: '1W', value: '15', sentimentTf: '7d', description: 'Weekly' },
  { label: '1M', value: '30', sentimentTf: '30d', description: 'Monthly' },
  { label: '1Y', value: 'D', sentimentTf: '365d', description: 'Yearly' },
  { label: 'All', value: 'W', sentimentTf: '365d', description: 'All Time' },
] as const;

type SentimentTimeframe = '1d' | '7d' | '30d' | '365d';

function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

function formatLargeNumber(num: number | null): string {
  if (!num) return '-';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatSupply(num: number | null, symbol: string): string {
  if (!num) return '-';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B ${symbol}`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M ${symbol}`;
  return `${num.toLocaleString()} ${symbol}`;
}

export default function TradingCoinPage({ params }: PageProps) {
  const { symbol } = use(params);
  
  const router = useRouter();
  const [interval, setInterval] = useState('5');
  const [sentimentTf, setSentimentTf] = useState<SentimentTimeframe>('1d');
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch coin data
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/crypto/${symbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCoinData(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [symbol]);

  // Check favorite status
  useEffect(() => {
    const saved = localStorage.getItem('crypto-favorites');
    if (saved) {
      const favorites = new Set(JSON.parse(saved));
      setIsFavorite(favorites.has(symbol.toUpperCase()));
    }
  }, [symbol]);

  const toggleFavorite = () => {
    const saved = localStorage.getItem('crypto-favorites');
    const favorites = new Set(saved ? JSON.parse(saved) : []);
    
    if (isFavorite) {
      favorites.delete(symbol.toUpperCase());
    } else {
      favorites.add(symbol.toUpperCase());
    }
    
    localStorage.setItem('crypto-favorites', JSON.stringify([...favorites]));
    setIsFavorite(!isFavorite);
  };

  const price = coinData?.price || 0;
  const change24h = coinData?.change24h || 0;
  const isPositive = change24h >= 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 hover:bg-accent rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {coinData?.logo ? (
                <div className="relative w-8 h-8">
                  <Image
                    src={coinData.logo}
                    alt={coinData.name || symbol}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              )}
              <div>
                <h1 className="text-lg font-bold">{symbol.toUpperCase()}/USDT</h1>
                <p className="text-xs text-muted-foreground">{coinData?.name || 'Loading...'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleFavorite} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Star className={cn("h-5 w-5", isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold font-mono">
            {isLoading ? (
              <span className="inline-block w-32 h-9 bg-muted rounded animate-pulse" />
            ) : (
              `$${formatPrice(price)}`
            )}
          </span>
          <span className={cn(
            "text-sm font-semibold flex items-center gap-1",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </span>
          {coinData?.rank && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Rank #{coinData.rank}
            </span>
          )}
        </div>
      </div>

      {/* Interval Tabs */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex gap-1">
          {INTERVALS.map((int) => (
            <button
              key={int.value}
              onClick={() => {
                setInterval(int.value);
                setSentimentTf(int.sentimentTf);
              }}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-colors",
                interval === int.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {int.label}
            </button>
          ))}
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="h-80 border-b border-border">
        <TradingViewChart 
          symbol={`BINANCE:${symbol.toUpperCase()}USDT`}
          height="100%"
          interval={interval}
        />
      </div>

      {/* Market Stats */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-3">Market Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Market Cap</div>
            <div className="font-semibold">{formatLargeNumber(coinData?.marketCap || null)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">24h Volume</div>
            <div className="font-semibold">{formatLargeNumber(coinData?.volume24h || null)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Circulating Supply</div>
            <div className="font-semibold">{formatSupply(coinData?.circulatingSupply || null, symbol.toUpperCase())}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">7d Change</div>
            <div className={cn(
              "font-semibold",
              (coinData?.change7d || 0) >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {coinData?.change7d ? `${coinData.change7d >= 0 ? '+' : ''}${coinData.change7d.toFixed(2)}%` : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Supply</div>
            <div className="font-semibold">{formatSupply(coinData?.totalSupply || null, symbol.toUpperCase())}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Max Supply</div>
            <div className="font-semibold">{formatSupply(coinData?.maxSupply || null, symbol.toUpperCase())}</div>
          </div>
        </div>
      </div>

      {/* AI Sentiment Card */}
      <div className="p-4 border-b border-border">
        <AISentimentCard symbol={symbol.toUpperCase()} name={coinData?.name || symbol} timeframe={sentimentTf} />
      </div>

      {/* About Section */}
      {coinData?.description && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">About {coinData.name}</h3>
            {coinData.website && (
              <a 
                href={coinData.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-4">
            {coinData.description.replace(/<[^>]*>/g, '').substring(0, 400)}...
          </p>
        </div>
      )}

      {/* Spacer for bottom buttons */}
      <div className="flex-1" />

      {/* Action Buttons - Fixed at bottom */}
      <div className="sticky bottom-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm pb-20">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => router.push(`/trading/${symbol}/buy`)}
            className="bg-green-500 hover:bg-green-600 h-12 text-base font-semibold"
          >
            Buy {symbol.toUpperCase()}
          </Button>
          <Button 
            onClick={() => router.push(`/trading/${symbol}/sell`)}
            className="bg-red-500 hover:bg-red-600 h-12 text-base font-semibold"
          >
            Sell {symbol.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
}
