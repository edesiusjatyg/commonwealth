// Trading API Configuration
export const TRADING_CONFIG = {
  // 0x API Configuration
  ZERO_X_API_URL: 'https://api.0x.org',
  ZERO_X_API_VERSION: 'v2',
  
  // Chain IDs
  CHAIN_IDS: {
    BASE_SEPOLIA: 84532,  // Testnet (safer for MVP)
    BASE_MAINNET: 8453,   // Production
  },
  
  // Default to testnet for safety
  DEFAULT_CHAIN_ID: 84532,
  
  // RPC URLs
  RPC_URLS: {
    84532: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    8453: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
  },
  
  // Default slippage tolerance (0.5%)
  DEFAULT_SLIPPAGE_BPS: 50,
  
  // Token addresses on Base Sepolia
  TOKENS: {
    SEPOLIA: {
      ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
      WETH: '0x4200000000000000000000000000000000000006',
      USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    },
    MAINNET: {
      ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      WETH: '0x4200000000000000000000000000000000000006',
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
      DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    }
  },
  
  // Popular tokens for the trading list
  POPULAR_TOKENS: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    },
  ],
} as const;

// Get 0x API key from environment
export function getZeroXApiKey(): string {
  const apiKey = process.env.ZERO_X_API_KEY;
  
  if (!apiKey) {
    throw new Error('ZERO_X_API_KEY is not configured in environment variables');
  }
  
  return apiKey;
}

// Get current chain ID from environment or use default
export function getChainId(): number {
  return Number(process.env.NEXT_PUBLIC_CHAIN_ID) || TRADING_CONFIG.DEFAULT_CHAIN_ID;
}

// Get token address for current chain
export function getTokenAddress(symbol: string, chainId?: number): string {
  const chain = (chainId || getChainId()) === TRADING_CONFIG.CHAIN_IDS.BASE_MAINNET 
    ? 'MAINNET' 
    : 'SEPOLIA';
  
  const tokens = TRADING_CONFIG.TOKENS[chain];
  const address = tokens[symbol as keyof typeof tokens];
  
  if (!address) {
    throw new Error(`Token ${symbol} not found for chain ${chain}`);
  }
  
  return address;
}
