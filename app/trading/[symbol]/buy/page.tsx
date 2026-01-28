'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Minus, Plus, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/components/trading/portfolio-context';
import { toast } from 'sonner';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit';

const ORDER_TYPES: { value: OrderType; label: string; description: string }[] = [
  { value: 'market', label: 'Market Order', description: 'Buy crypto at best available price' },
  { value: 'limit', label: 'Limit Order', description: 'Trigger buy when price falls to specified price or lower' },
  { value: 'stop', label: 'Stop Order', description: 'Trigger market buy when price rises to specified price or higher' },
  { value: 'stop-limit', label: 'Stop-Limit Order', description: 'Trigger limit buy when price rises to specified price or higher' },
];

export default function BuyPage({ params }: PageProps) {
  const { symbol } = use(params);
  const router = useRouter();
  const portfolio = usePortfolio();
  
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [showOrderTypes, setShowOrderTypes] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [takeProfitPercent, setTakeProfitPercent] = useState('');
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossPercent, setStopLossPercent] = useState('');
  
  const [coinData, setCoinData] = useState<{ name: string; price: number; logo: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/crypto/${symbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCoinData({
            name: data.data.name,
            price: data.data.price,
            logo: data.data.logo || `https://s2.coinmarketcap.com/static/img/coins/64x64/${data.data.id || 1}.png`,
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [symbol]);

  const price = coinData?.price || 0;
  const qtyNumber = parseFloat(quantity) || 0;
  const estimatedCoins = price > 0 ? qtyNumber / price : 0;
  const minAmount = 10; // Minimum $10 USDT

  const handleQuantityChange = (delta: number) => {
    const current = parseFloat(quantity) || 0;
    const newVal = Math.max(minAmount, current + delta);
    setQuantity(newVal.toString());
  };

  const handleSubmit = async () => {
    if (qtyNumber < minAmount) {
      toast.error(`Minimum order is $${minAmount} USDT`);
      return;
    }

    if (qtyNumber > portfolio.usdtBalance) {
      toast.error('Insufficient USDT balance');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      portfolio.addPosition({
        symbol: symbol.toUpperCase(),
        name: coinData?.name || symbol,
        logo: coinData?.logo || '',
        quantity: estimatedCoins,
        avgPrice: price,
        currentPrice: price,
        orderType,
      });

      toast.success(`Successfully bought ${estimatedCoins.toFixed(6)} ${symbol.toUpperCase()}`);
      router.back();
    } catch (error) {
      toast.error('Order failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = qtyNumber >= minAmount && qtyNumber <= portfolio.usdtBalance && !isSubmitting;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Buy {symbol.toUpperCase()}</h1>
          </div>
        </div>

        {/* Current Price */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            {coinData?.logo && (
              <Image
                src={coinData.logo}
                alt={symbol}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <div className="text-2xl font-bold font-mono">
                ${isLoading ? '...' : price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Current Market Price</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-32">
        {/* Order Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Order Type</label>
          <button
            onClick={() => setShowOrderTypes(true)}
            className="w-full flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <span>{ORDER_TYPES.find(o => o.value === orderType)?.label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Limit/Stop Price Inputs */}
        {(orderType === 'limit' || orderType === 'stop-limit') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Limit Price (USDT)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
            />
          </div>
        )}

        {(orderType === 'stop' || orderType === 'stop-limit') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Stop Price (USDT)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
            />
          </div>
        )}

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Qty in USDT</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(-100)}
              className="p-3 bg-muted rounded-lg hover:bg-muted/80"
            >
              <Minus className="h-4 w-4" />
            </button>
            <Input
              type="number"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="text-center text-lg font-mono"
            />
            <button
              onClick={() => handleQuantityChange(100)}
              className="p-3 bg-muted rounded-lg hover:bg-muted/80"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Minimum: ${minAmount} USDT</span>
            <span className="text-muted-foreground">≈ {estimatedCoins.toFixed(6)} {symbol.toUpperCase()}</span>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {['100', '500', '1000', 'MAX'].map((amt) => (
            <button
              key={amt}
              onClick={() => setQuantity(amt === 'MAX' ? portfolio.usdtBalance.toString() : amt)}
              className="py-2 text-sm font-medium bg-muted rounded-lg hover:bg-muted/80"
            >
              {amt === 'MAX' ? 'MAX' : `$${amt}`}
            </button>
          ))}
        </div>

        {/* Take Profit / Stop Loss */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Take Profit</div>
              <div className="text-xs text-muted-foreground">Optional - Set target profit</div>
            </div>
            <Switch checked={takeProfitEnabled} onCheckedChange={setTakeProfitEnabled} />
          </div>
          {takeProfitEnabled && (
            <Input
              type="number"
              placeholder="Profit % (e.g. 10)"
              value={takeProfitPercent}
              onChange={(e) => setTakeProfitPercent(e.target.value)}
            />
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Stop Loss</div>
                <div className="text-xs text-muted-foreground">Optional - Limit your loss</div>
              </div>
              <Switch checked={stopLossEnabled} onCheckedChange={setStopLossEnabled} />
            </div>
          </div>
          {stopLossEnabled && (
            <Input
              type="number"
              placeholder="Loss % (e.g. 5)"
              value={stopLossPercent}
              onChange={(e) => setStopLossPercent(e.target.value)}
            />
          )}
        </Card>

        {/* Balance & Estimation */}
        <Card className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buying Power</span>
            <span className="font-mono">${portfolio.usdtBalance.toLocaleString()} USDT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. To Be Paid</span>
            <span className="font-mono font-semibold">${qtyNumber.toLocaleString()} USDT</span>
          </div>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border pb-6">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "w-full h-14 text-lg font-semibold",
            canSubmit ? "bg-green-500 hover:bg-green-600" : "bg-muted text-muted-foreground"
          )}
        >
          {isSubmitting ? 'Processing...' : `Buy ${symbol.toUpperCase()}`}
        </Button>
      </div>

      {/* Order Type Modal */}
      {showOrderTypes && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowOrderTypes(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Choose Order Type</h3>
            <div className="space-y-2">
              {ORDER_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setOrderType(type.value);
                    setShowOrderTypes(false);
                  }}
                  className={cn(
                    "w-full p-4 rounded-lg text-left flex items-center justify-between",
                    orderType === type.value ? "bg-green-500/10 border border-green-500" : "bg-muted"
                  )}
                >
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                  {orderType === type.value && <Check className="h-5 w-5 text-green-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
