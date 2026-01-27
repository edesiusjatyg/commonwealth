'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Star, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface Market {
  id: number;
  rank: number;
  symbol: string;
  name: string;
  slug: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  logo: string;
}

type SortKey = 'rank' | 'price' | 'change24h' | 'change7d' | 'marketCap' | 'volume24h';
type SortDirection = 'asc' | 'desc';

function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch markets data
  useEffect(() => {
    const fetchMarkets = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/markets?limit=100');
        const data = await res.json();
        if (data.success) {
          setMarkets(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch markets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
    // Refresh every 60 seconds
    const interval = setInterval(fetchMarkets, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('crypto-favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol);
    } else {
      newFavorites.add(symbol);
    }
    setFavorites(newFavorites);
    localStorage.setItem('crypto-favorites', JSON.stringify([...newFavorites]));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'rank' ? 'asc' : 'desc');
    }
  };

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let result = [...markets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.symbol.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query)
      );
    }

    // Tab filter
    switch (activeTab) {
      case 'favorites':
        result = result.filter(m => favorites.has(m.symbol));
        break;
      case 'gainers':
        result = result.filter(m => m.change24h > 0).sort((a, b) => b.change24h - a.change24h);
        break;
      case 'losers':
        result = result.filter(m => m.change24h < 0).sort((a, b) => a.change24h - b.change24h);
        break;
      case 'hot':
        result = result.sort((a, b) => b.volume24h - a.volume24h).slice(0, 20);
        break;
    }

    // Apply sorting (except for special tabs)
    if (!['gainers', 'losers', 'hot'].includes(activeTab)) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        return (aVal - bVal) * modifier;
      });
    }

    return result;
  }, [markets, searchQuery, activeTab, sortKey, sortDirection, favorites]);

  const SortHeader = ({ label, sortKeyName, className }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className={cn(
        "flex items-center gap-1 hover:text-foreground transition-colors",
        sortKey === sortKeyName && "text-primary",
        className
      )}
    >
      {label}
      {sortKey === sortKeyName && (
        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Markets</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coins..."
              className="pl-9 bg-muted/50 border-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9 bg-transparent gap-1 p-0">
              <TabsTrigger value="all" className="px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
                All
              </TabsTrigger>
              <TabsTrigger value="favorites" className="px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
                <Star className="h-3 w-3 mr-1" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="hot" className="px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
                <Flame className="h-3 w-3 mr-1" />
                Hot
              </TabsTrigger>
              <TabsTrigger value="gainers" className="px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
                <TrendingUp className="h-3 w-3 mr-1" />
                Gainers
              </TabsTrigger>
              <TabsTrigger value="losers" className="px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full">
                <TrendingDown className="h-3 w-3 mr-1" />
                Losers
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table Header */}
        <div className="px-4 py-2 grid grid-cols-12 gap-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
          <div className="col-span-1">
            <SortHeader label="#" sortKeyName="rank" />
          </div>
          <div className="col-span-3">Name</div>
          <div className="col-span-2 text-right">
            <SortHeader label="Price" sortKeyName="price" className="justify-end" />
          </div>
          <div className="col-span-2 text-right">
            <SortHeader label="24h %" sortKeyName="change24h" className="justify-end" />
          </div>
          <div className="col-span-2 text-right hidden sm:block">
            <SortHeader label="7d %" sortKeyName="change7d" className="justify-end" />
          </div>
          <div className="col-span-2 text-right hidden md:block">
            <SortHeader label="Market Cap" sortKeyName="marketCap" className="justify-end" />
          </div>
        </div>
      </div>

      {/* Market List */}
      <div className="pb-20">
        {isLoading ? (
          // Loading skeleton
          <div className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-4 py-3 grid grid-cols-12 gap-2 items-center animate-pulse">
                <div className="col-span-1 h-4 bg-muted rounded" />
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="col-span-2 h-4 bg-muted rounded ml-auto w-20" />
                <div className="col-span-2 h-4 bg-muted rounded ml-auto w-14" />
                <div className="col-span-2 h-4 bg-muted rounded ml-auto w-14 hidden sm:block" />
                <div className="col-span-2 h-4 bg-muted rounded ml-auto w-20 hidden md:block" />
              </div>
            ))}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg">No coins found</p>
            <p className="text-sm">Try a different search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredMarkets.map((market) => {
              const isPositive24h = market.change24h >= 0;
              const isPositive7d = market.change7d >= 0;
              const isFavorite = favorites.has(market.symbol);

              return (
                <Link
                  key={market.id}
                  href={`/trading/${market.symbol.toLowerCase()}`}
                  className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-accent/50 active:bg-accent transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center gap-1">
                    <button
                      onClick={(e) => toggleFavorite(market.symbol, e)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
                        )}
                      />
                    </button>
                    <span className="text-xs text-muted-foreground">{market.rank}</span>
                  </div>

                  {/* Name & Symbol */}
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image
                        src={market.logo}
                        alt={market.name}
                        fill
                        className="rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-token.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{market.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">{market.name}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-sm font-medium">
                      ${formatPrice(market.price)}
                    </span>
                  </div>

                  {/* 24h Change */}
                  <div className="col-span-2 text-right">
                    <span className={cn(
                      "text-sm font-medium",
                      isPositive24h ? "text-green-500" : "text-red-500"
                    )}>
                      {isPositive24h ? '+' : ''}{market.change24h.toFixed(2)}%
                    </span>
                  </div>

                  {/* 7d Change */}
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className={cn(
                      "text-sm font-medium",
                      isPositive7d ? "text-green-500" : "text-red-500"
                    )}>
                      {isPositive7d ? '+' : ''}{market.change7d.toFixed(2)}%
                    </span>
                  </div>

                  {/* Market Cap */}
                  <div className="col-span-2 text-right hidden md:block">
                    <span className="text-sm text-muted-foreground">
                      {formatLargeNumber(market.marketCap)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
