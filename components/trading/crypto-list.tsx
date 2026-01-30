'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Token } from '@/types/trading';

interface CryptoListProps {
  onSelectToken: (token: Token) => void;
}

// Mock price data - in production, fetch from real API
const mockPrices: Record<string, { price: number; change24h: number }> = {
  ETH: { price: 3245.67, change24h: 5.23 },
  USDC: { price: 1.00, change24h: 0.01 },
};

export function CryptoList({ onSelectToken }: CryptoListProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch token list
  useEffect(() => {
    fetch('/api/trading/tokens')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTokens(data.tokens);
          setFilteredTokens(data.tokens);
        }
      })
      .catch((error) => console.error('Failed to fetch tokens:', error))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter tokens based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTokens(tokens);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query)
    );
    setFilteredTokens(filtered);
  }, [searchQuery, tokens]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
              <div className="h-6 w-24 rounded bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search cryptocurrencies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Token List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredTokens.map((token, index) => {
            const priceData = mockPrices[token.symbol] || { price: 0, change24h: 0 };
            const isPositive = priceData.change24h >= 0;

            return (
              <motion.div
                key={token.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
                  onClick={() => onSelectToken(token)}
                >
                  <div className="flex items-center gap-3">
                    {/* Token Icon */}
                    <img
                      src={token.logo}
                      alt={token.name}
                      className="h-10 w-10 rounded-full"
                      onError={(e) => {
                        // Fallback to default icon
                        e.currentTarget.src = '/default-token.png';
                      }}
                    />

                    {/* Token Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {token.symbol}
                        </span>
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{token.name}</p>
                    </div>

                    {/* Price Info */}
                    <div className="text-right">
                      <p className="font-semibold">
                        ${priceData.price.toLocaleString()}
                      </p>
                      <p
                        className={`text-sm ${
                          isPositive ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {priceData.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No cryptocurrencies found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
