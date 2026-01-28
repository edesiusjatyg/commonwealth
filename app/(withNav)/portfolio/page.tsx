'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/components/trading/portfolio-context';
import Link from 'next/link';
import Image from 'next/image';

type TabType = 'overview' | 'assets';

function formatMoney(num: number): string {
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export default function PortfolioPage() {
  const portfolio = usePortfolio();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['assetValue', 'pnl']));

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  // Calculate allocation
  const positionsValue = portfolio.positions.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0);
  const totalAssets = portfolio.usdtBalance + positionsValue;
  const coinAllocation = totalAssets > 0 ? (positionsValue / totalAssets) * 100 : 0;
  const cashAllocation = totalAssets > 0 ? (portfolio.usdtBalance / totalAssets) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Portfolio</h1>
        </div>

        {/* Section Tabs */}
        <div className="px-4 pb-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="h-9 bg-transparent gap-1 p-0">
              <TabsTrigger 
                value="overview" 
                className="px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="assets" 
                className="px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
              >
                Assets
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="p-4 space-y-4">
          {/* Portfolio Value Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Portfolio Value</span>
            </div>
            <div className="text-3xl font-bold font-mono mb-1">
              ${formatMoney(portfolio.totalValue)}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              portfolio.totalPnL >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {portfolio.totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{portfolio.totalPnL >= 0 ? '+' : ''}${formatMoney(Math.abs(portfolio.totalPnL))}</span>
              <span>({formatPercent(portfolio.totalPnLPercent)})</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </Card>

          {/* Asset Allocation */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Asset Allocation</h3>
            <div className="flex items-center gap-4">
              {/* Simple donut visualization */}
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted"
                  />
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${coinAllocation} ${100 - coinAllocation}`}
                    strokeDashoffset="25"
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-mono">${formatMoney(totalAssets).split('.')[0]}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm">Coins</span>
                  <span className="text-sm text-muted-foreground ml-auto">{coinAllocation.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-sm">USDT (Cash)</span>
                  <span className="text-sm text-muted-foreground ml-auto">{cashAllocation.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Asset & Cash Value - Expandable */}
          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection('assetValue')}
              className="w-full p-4 flex items-center justify-between"
            >
              <span className="font-semibold">Asset & Cash Value</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">${formatMoney(portfolio.totalValue)}</span>
                {expandedSections.has('assetValue') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>
            {expandedSections.has('assetValue') && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net Asset Value</span>
                  <span className="font-mono">${formatMoney(positionsValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">USDT Cash</span>
                  <span className="font-mono">${formatMoney(portfolio.usdtBalance)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Unrealized P&L - Expandable */}
          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection('pnl')}
              className="w-full p-4 flex items-center justify-between"
            >
              <span className="font-semibold">Unrealized P&L</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-mono",
                  portfolio.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {portfolio.totalPnL >= 0 ? '+' : ''}${formatMoney(Math.abs(portfolio.totalPnL))}
                  <span className="text-xs ml-1">({formatPercent(portfolio.totalPnLPercent)})</span>
                </span>
                {expandedSections.has('pnl') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>
            {expandedSections.has('pnl') && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Asset Gain/Loss</span>
                  <span className={cn(
                    "font-mono",
                    portfolio.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {portfolio.totalPnL >= 0 ? '+' : ''}${formatMoney(Math.abs(portfolio.totalPnL))}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Holdings */}
          {portfolio.positions.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Coins</span>
                  <span className="text-sm text-muted-foreground">{coinAllocation.toFixed(1)}%</span>
                </div>
                <div className="text-lg font-mono mt-1">${formatMoney(positionsValue)}</div>
              </div>
              <div className="divide-y divide-border">
                {portfolio.positions.map((position) => {
                  const value = position.quantity * position.currentPrice;
                  const pnl = (position.currentPrice - position.avgPrice) * position.quantity;
                  const pnlPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;
                  
                  return (
                    <Link
                      key={position.id}
                      href={`/trading/${position.symbol.toLowerCase()}`}
                      className="flex items-center p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="relative w-10 h-10 mr-3">
                        <Image
                          src={position.logo}
                          alt={position.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{position.symbol}</div>
                        <div className="text-sm text-muted-foreground">{position.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">${formatMoney(value)}</div>
                        <div className={cn(
                          "text-sm",
                          pnl >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {pnl >= 0 ? '+' : ''}${formatMoney(Math.abs(pnl))} ({formatPercent(pnlPercent)})
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {/* USDT Balance */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">USDT Balance</span>
              <span className="text-sm text-muted-foreground">{cashAllocation.toFixed(1)}%</span>
            </div>
            <div className="text-lg font-mono mt-1">${formatMoney(portfolio.usdtBalance)}</div>
          </Card>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="divide-y divide-border">
          {portfolio.positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <PieChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No assets yet</p>
              <p className="text-sm text-muted-foreground mb-4">Start trading to build your portfolio</p>
              <Link
                href="/trading"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Browse Markets
              </Link>
            </div>
          ) : (
            portfolio.positions.map((position) => {
              const value = position.quantity * position.currentPrice;
              const pnlPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;
              
              return (
                <Link
                  key={position.id}
                  href={`/trading/${position.symbol.toLowerCase()}`}
                  className="flex items-center p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="relative w-10 h-10 mr-3">
                    <Image
                      src={position.logo}
                      alt={position.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{position.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      {position.quantity.toFixed(6)} {position.symbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">${formatMoney(value)}</div>
                    <div className={cn(
                      "text-sm",
                      pnlPercent >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {formatPercent(pnlPercent)}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
