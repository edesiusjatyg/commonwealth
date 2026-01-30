'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/components/trading/wallet-provider';
import { toast } from 'sonner';
import type { Token, SwapQuote, TradeSide } from '@/types/trading';

interface UseTradingReturn {
  isLoading: boolean;
  quote: SwapQuote | null;
  error: string | null;
  fetchQuote: (sellToken: Token, buyToken: Token, amount: string) => Promise<void>;
  executeSwap: (quote: SwapQuote) => Promise<string>;
  resetQuote: () => void;
}

export function useTrading(): UseTradingReturn {
  const { provider, address, chainId, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(
    async (sellToken: Token, buyToken: Token, amount: string) => {
      if (!isConnected || !address) {
        toast.error('Please connect your wallet first');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert amount to wei (assuming 18 decimals for now)
        const sellAmount = BigInt(Number(amount) * 10 ** sellToken.decimals).toString();

        const params = new URLSearchParams({
          sellToken: sellToken.address,
          buyToken: buyToken.address,
          sellAmount,
          takerAddress: address,
          chainId: String(chainId || 84532),
        });

        const response = await fetch(`/api/trading/quote?${params}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch quote');
        }

        setQuote(data.quote);
        toast.success('Quote fetched successfully');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch quote';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, chainId]
  );

  const executeSwap = useCallback(
    async (swapQuote: SwapQuote): Promise<string> => {
      if (!provider || !isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);

      try {
        // Check if need to approve tokens first
        if (swapQuote.allowanceTarget && swapQuote.sellToken !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
          toast.info('Checking token allowance...');
          
          // For MVP, we'll skip the allowance check
          // In production, check ERC20 allowance and request approval if needed
        }

        // Send the swap transaction
        toast.info('Please confirm the transaction in your wallet');

        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: address,
              to: swapQuote.to,
              data: swapQuote.data,
              value: swapQuote.value,
              gas: swapQuote.gas,
              gasPrice: swapQuote.gasPrice,
            },
          ],
        }) as string;

        toast.success('Transaction submitted!', {
          description: `TX: ${txHash.slice(0, 10)}...`,
          action: {
            label: 'View',
            onClick: () => {
              const explorerUrl = chainId === 8453 
                ? 'https://basescan.org' 
                : 'https://sepolia.basescan.org';
              window.open(`${explorerUrl}/tx/${txHash}`, '_blank');
            },
          },
        });

        setQuote(null);
        return txHash;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Transaction failed';
        toast.error(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [provider, isConnected, address, chainId]
  );

  const resetQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return {
    isLoading,
    quote,
    error,
    fetchQuote,
    executeSwap,
    resetQuote,
  };
}
