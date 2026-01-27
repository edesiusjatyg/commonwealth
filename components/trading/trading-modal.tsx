'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ArrowDownUp, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from './wallet-provider';
import { useTrading } from '@/hooks/use-trading';
import { toast } from 'sonner';
import type { Token } from '@/types/trading';

interface TradingModalProps {
  token: Token | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TradingModal({ token, isOpen, onClose }: TradingModalProps) {
  const { isConnected, connect, address, chainId } = useWallet();
  const { fetchQuote, executeSwap, quote, isLoading, resetQuote } = useTrading();
  
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [usdcToken, setUsdcToken] = useState<Token | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');

  // Fetch USDC token for trading pair
  useEffect(() => {
    if (isOpen) {
      fetch('/api/trading/tokens')
        .then((res) => res.json())
        .then((data) => {
          const usdc = data.tokens.find((t: Token) => t.symbol === 'USDC');
          if (usdc) setUsdcToken(usdc);
        });
    }
  }, [isOpen]);

  // Fetch AI sentiment when modal opens
  useEffect(() => {
    if (isOpen && token) {
      setAiInsight('Loading AI insights...');
      
      // Call existing AI sentiment API
      fetch(`/api/ai/sentiment?crypto=${token.symbol}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.sentiment) {
            setAiInsight(data.sentiment);
          } else {
            setAiInsight('AI insights temporarily unavailable');
          }
        })
        .catch(() => {
          setAiInsight('AI insights temporarily unavailable');
        });
    }
  }, [isOpen, token]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setActiveTab('buy');
      resetQuote();
      setAiInsight('');
    }
  }, [isOpen, resetQuote]);

  if (!token || !usdcToken) return null;

  const handleGetQuote = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    const sellToken = activeTab === 'buy' ? usdcToken : token;
    const buyToken = activeTab === 'buy' ? token : usdcToken;

    await fetchQuote(sellToken, buyToken, amount);
  };

  const handleExecute = async () => {
    if (!quote) return;

    try {
      await executeSwap(quote);
      toast.success('Trade completed successfully!');
      onClose();
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const expectedOutput = quote
    ? (Number(quote.buyAmount) / 10 ** (activeTab === 'buy' ? token.decimals : usdcToken.decimals)).toFixed(6)
    : '0';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-3">
            <img src={token.logo} alt={token.name} className="h-8 w-8 rounded-full" />
            <div>
              <h2 className="text-xl font-bold">{token.symbol}</h2>
              <p className="text-sm text-muted-foreground">{token.name}</p>
            </div>
          </DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        {/* AI Insight Card */}
        {aiInsight && (
          <Card className="p-4 bg-accent/20 border-accent">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">AI Market Insight</h3>
                <p className="text-sm text-muted-foreground">{aiInsight}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Buy/Sell Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy {token.symbol}</TabsTrigger>
            <TabsTrigger value="sell">Sell {token.symbol}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Amount ({activeTab === 'buy' ? 'USDC' : token.symbol})
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Quote Preview */}
            {quote && (
              <Card className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">You will receive</span>
                  <span className="text-lg font-semibold">
                    {expectedOutput} {activeTab === 'buy' ? token.symbol : 'USDC'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span>{quote.price}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Gas Fee (est.)</span>
                  <span>{(Number(quote.gas) / 10 ** 9).toFixed(6)} Gwei</span>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {!isConnected ? (
                <Button onClick={connect} className="w-full" size="lg">
                  Connect Wallet
                </Button>
              ) : !quote ? (
                <Button
                  onClick={handleGetQuote}
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !amount}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Quote...
                    </>
                  ) : (
                    'Get Quote'
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={handleExecute}
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Execute ${activeTab === 'buy' ? 'Buy' : 'Sell'}`
                    )}
                  </Button>
                  <Button
                    onClick={() => resetQuote()}
                    variant="outline"
                    className="w-full"
                  >
                    Get New Quote
                  </Button>
                </div>
              )}
            </div>

            {/* Network Info */}
            {isConnected && (
              <div className="text-xs text-muted-foreground text-center">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)} •{' '}
                {chainId === 8453 ? 'Base Mainnet' : 'Base Sepolia'}
              </div>
            )}
          </TabsContent>
      </Tabs>
    </div>
      </DialogContent>
    </Dialog>
  );
}
