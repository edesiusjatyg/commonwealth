// Trading API Types
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
  chainId: number;
  network?: string;
}

export interface SwapQuote {
  buyAmount: string;
  sellAmount: string;
  buyToken: string;
  sellToken: string;
  price: string;
  guaranteedPrice: string;
  gas: string;
  gasPrice: string;
  estimatedGas: string;
  allowanceTarget: string;
  to: string;
  data: string;
  value: string;
}

export interface QuoteResponse {
  success: boolean;
  quote: SwapQuote;
  timestamp: number;
}

export interface TokensResponse {
  success: boolean;
  tokens: Token[];
  chainId: number;
  network: string;
}

export type TradeSide = 'buy' | 'sell';

export interface TradeParams {
  token: Token;
  amount: string;
  side: TradeSide;
}
