'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Minus, Plus, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/components/trading/portfolio-context';
import { toast } from 'sonner';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit';
type Leverage = 'none' | '2x' | '4x';

const ORDER_TYPES: { value: OrderType; label: string; description: string }[] = [
  { value: 'market', label: 'Market Order', description: 'Sell at best available price' },
  { value: 'limit', label: 'Limit Order', description: 'Trigger sell when price rises to specified price or higher' },
  { value: 'stop', label: 'Stop Order', description: 'Trigger market sell when price drops to specified price or lower' },
  { value: 'stop-limit', label: 'Stop-Limit Order', description: 'Trigger limit sell when price drops to specified price or lower' },
];

const LEVERAGE_OPTIONS: { value: Leverage; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: '2x', label: '2x' },
  { value: '4x', label: '4x (Day Trade)' },
];

export default function SellPage({ params }: PageProps) {
  const { symbol } = use(params);
  const router = useRouter();
  const portfolio = usePortfolio();
  
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [showOrderTypes, setShowOrderTypes] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [leverage, setLeverage] = useState<Leverage>('none');
  
  const [coinData, setCoinData] = useState<{ name: string; price: number; logo: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find user's position for this coin
  const position = portfolio.positions.find(p => p.symbol === symbol.toUpperCase());
  const availableQuantity = position?.quantity || 0;

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
  const estimatedReceived = qtyNumber * price;

  const handleQuantityChange = (delta: number) => {
    const current = parseFloat(quantity) || 0;
    const newVal = Math.max(0, Math.min(availableQuantity, current + delta));
    setQuantity(newVal.toString());
  };

  const handleSubmit = async () => {
    if (qtyNumber <= 0) {
      toast.error('Please enter a quantity');
      return;
    }

    if (qtyNumber > availableQuantity) {
      toast.error('Insufficient holdings');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      if (position) {
        // Update or remove position
        if (qtyNumber >= position.quantity) {
          portfolio.removePosition(position.id);
        } else {
          // Partial sell - would need to update position quantity
          // For simplicity, we remove entire position here
          portfolio.removePosition(position.id);
          // Re-add with remaining quantity
          const remaining = position.quantity - qtyNumber;
          portfolio.addPosition({
            symbol: position.symbol,
            name: position.name,
            logo: position.logo,
            quantity: remaining,
            avgPrice: position.avgPrice,
            currentPrice: price,
            orderType: 'market',
          });
        }
      }

      toast.success(`Successfully sold ${qtyNumber.toFixed(6)} ${symbol.toUpperCase()} for $${estimatedReceived.toFixed(2)}`);
      router.back();
    } catch (error) {
      toast.error('Order failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = qtyNumber > 0 && qtyNumber <= availableQuantity && !isSubmitting;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Sell {symbol.toUpperCase()}</h1>
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
        {/* No Holdings Warning */}
        {availableQuantity === 0 && (
          <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              You don't have any {symbol.toUpperCase()} to sell. Buy some first!
            </div>
          </Card>
        )}

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
          <label className="text-sm font-medium">Qty in {symbol.toUpperCase()}</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(-0.01)}
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
              onClick={() => handleQuantityChange(0.01)}
              className="p-3 bg-muted rounded-lg hover:bg-muted/80"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available: {availableQuantity.toFixed(6)} {symbol.toUpperCase()}</span>
            <span className="text-muted-foreground">≈ ${estimatedReceived.toFixed(2)} USDT</span>
          </div>
        </div>

        {/* Quick Sell Percentages */}
        <div className="grid grid-cols-4 gap-2">
          {['25%', '50%', '75%', '100%'].map((pct) => (
            <button
              key={pct}
              onClick={() => {
                const percent = parseInt(pct) / 100;
                setQuantity((availableQuantity * percent).toString());
              }}
              className="py-2 text-sm font-medium bg-muted rounded-lg hover:bg-muted/80"
            >
              {pct}
            </button>
          ))}
        </div>

        {/* Leverage */}
        <Card className="p-4">
          <label className="text-sm font-medium mb-2 block">Leverage</label>
          <div className="flex gap-2">
            {LEVERAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLeverage(opt.value)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                  leverage === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Balance & Estimation */}
        <Card className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-mono">{availableQuantity.toFixed(6)} {symbol.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. To Be Received</span>
            <span className="font-mono font-semibold">${estimatedReceived.toFixed(2)} USDT</span>
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
            canSubmit ? "bg-red-500 hover:bg-red-600" : "bg-muted text-muted-foreground"
          )}
        >
          {isSubmitting ? 'Processing...' : `Sell ${symbol.toUpperCase()}`}
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
                    orderType === type.value ? "bg-red-500/10 border border-red-500" : "bg-muted"
                  )}
                >
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                  {orderType === type.value && <Check className="h-5 w-5 text-red-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
