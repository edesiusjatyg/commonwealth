const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

interface CMCQuote {
  price: number;
  volume_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
}

export interface CMCCoinInfo {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  quote: { USD: CMCQuote };
}

export interface CMCMetadata {
  id: number;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  urls: {
    website: string[];
    twitter: string[];
    reddit: string[];
  };
}

export class CoinMarketCapService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API || process.env.CMC_API_KEY || '';
  }

  private get headers() {
    return {
      'X-CMC_PRO_API_KEY': this.apiKey,
      'Accept': 'application/json',
    };
  }

  async getTopCryptos(limit: number = 20): Promise<CMCCoinInfo[]> {
    if (!this.apiKey) {
      console.warn('CMC API Key missing - returning empty');
      return [];
    }

    try {
      const res = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/listings/latest?limit=${limit}&convert=USD`,
        { 
          headers: this.headers,
          next: { revalidate: 300 } // Cache for 5 min
        }
      );

      if (!res.ok) throw new Error(`CMC API Error: ${res.statusText}`);
      
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error('CMC getTopCryptos error:', error);
      return [];
    }
  }

  async getCoinInfo(symbol: string): Promise<CMCCoinInfo | null> {
    if (!this.apiKey) return null;

    try {
      const res = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}&convert=USD`,
        { 
          headers: this.headers,
          next: { revalidate: 300 }
        }
      );

      if (!res.ok) throw new Error(`CMC API Error: ${res.statusText}`);
      
      const data = await res.json();
      const symbolData = data.data?.[symbol.toUpperCase()];
      return symbolData || null;
    } catch (error) {
      console.error('CMC getCoinInfo error:', error);
      return null;
    }
  }

  async getMetadata(symbol: string): Promise<CMCMetadata | null> {
    if (!this.apiKey) return null;

    try {
      const res = await fetch(
        `${CMC_BASE_URL}/cryptocurrency/info?symbol=${symbol.toUpperCase()}`,
        { 
          headers: this.headers,
          next: { revalidate: 3600 } // Cache metadata for 1 hour
        }
      );

      if (!res.ok) throw new Error(`CMC API Error: ${res.statusText}`);
      
      const data = await res.json();
      const symbolData = data.data?.[symbol.toUpperCase()];
      return symbolData || null;
    } catch (error) {
      console.error('CMC getMetadata error:', error);
      return null;
    }
  }
}

export const cmcService = new CoinMarketCapService();
