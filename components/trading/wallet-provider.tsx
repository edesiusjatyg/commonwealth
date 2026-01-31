'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

type WalletProvider = ReturnType<CoinbaseWalletSDK['makeWeb3Provider']>;

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: WalletProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<WalletProvider | null>(null);
  const [sdk, setSdk] = useState<CoinbaseWalletSDK | null>(null);

  // Initialize Coinbase Wallet SDK
  useEffect(() => {
    const coinbaseWallet = new CoinbaseWalletSDK({
      appName: 'CommonWealth Trading',
      appLogoUrl: '/logo.png', // Use your app's logo
      darkMode: true,
    });

    const ethereum = coinbaseWallet.makeWeb3Provider();
    setProvider(ethereum);
    setSdk(coinbaseWallet);

    // Handler functions for cleanup
    const handleAccountsChanged = (accounts: readonly string[]) => {
      if (accounts.length === 0) {
        setIsConnected(false);
        setAddress(null);
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      // Reload page on chain change (recommended by Coinbase Wallet)
      window.location.reload();
    };

    // Check if already connected
    ethereum.request({ method: 'eth_accounts' })
      .then((accounts) => {
        const accountsList = accounts as string[];
        if (accountsList.length > 0) {
          setAddress(accountsList[0]);
          setIsConnected(true);

          // Get chain ID
          ethereum.request({ method: 'eth_chainId' })
            .then((chainIdHex) => {
              setChainId(parseInt(chainIdHex as string, 16));
            });
        }
      });

    // Listen for account changes
    ethereum.on('accountsChanged', handleAccountsChanged);

    // Listen for chain changes
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connect = async () => {
    if (!provider) throw new Error('Wallet not initialized');

    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);

        const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string;
        setChainId(parseInt(chainIdHex, 16));
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    // Note: Coinbase Wallet doesn't have a programmatic disconnect
    // User needs to disconnect from the wallet extension
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!provider) throw new Error('Wallet not initialized');

    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: unknown) {
      // Chain not added, add it
      if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
        const chainParams = getChainParams(targetChainId);
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [chainParams],
        });
      } else {
        throw error;
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        chainId,
        provider,
        connect,
        disconnect,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

// Helper to get chain parameters
function getChainParams(chainId: number) {
  const chains: Record<number, any> = {
    84532: {
      chainId: '0x14a34',
      chainName: 'Base Sepolia',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorerUrls: ['https://sepolia.basescan.org'],
    },
    8453: {
      chainId: '0x2105',
      chainName: 'Base',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org'],
    },
  };

  return chains[chainId] || chains[84532]; // Default to Sepolia
}
