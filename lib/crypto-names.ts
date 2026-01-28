// Mapping of cryptocurrency tickers to their full names for TradingView
// Used for generating proper TradingView widget links

export const CRYPTO_NAMES: Record<string, string> = {
  // Major Cryptocurrencies
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  XRP: "XRP",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  DOT: "Polkadot",
  LINK: "Chainlink",
  AVAX: "Avalanche",
  MATIC: "Polygon",
  SHIB: "Shiba Inu",
  LTC: "Litecoin",
  UNI: "Uniswap",
  ATOM: "Cosmos",
  NEAR: "NEAR Protocol",
  BCH: "Bitcoin Cash",
  XLM: "Stellar",
  FIL: "Filecoin",
  APT: "Aptos",
  ARB: "Arbitrum",
  OP: "Optimism",
  SUI: "Sui",
  AAVE: "Aave",
  MKR: "Maker",
  GRT: "The Graph",
  INJ: "Injective",
  TRX: "TRON",
  TON: "Toncoin",
  ICP: "Internet Computer",
  VET: "VeChain",
  FTM: "Fantom",
  ALGO: "Algorand",
  PEPE: "Pepe",
  WIF: "dogwifhat",
  BONK: "Bonk",
  RENDER: "Render",
  IMX: "Immutable",
  STX: "Stacks",
  SEI: "Sei",
  TIA: "Celestia",
  JUP: "Jupiter",
  PYTH: "Pyth Network",
  WLD: "Worldcoin",
  CRV: "Curve DAO",
  LDO: "Lido DAO",
  SAND: "The Sandbox",
  MANA: "Decentraland",
  AXS: "Axie Infinity",
  APE: "ApeCoin",
  GALA: "Gala",
  ENS: "Ethereum Name Service",
  SNX: "Synthetix",
  COMP: "Compound",
  ZRX: "0x",
  BAL: "Balancer",
  YFI: "yearn.finance",
  SUSHI: "SushiSwap",
  CRO: "Cronos",
  ETC: "Ethereum Classic",
  XMR: "Monero",
  ZEC: "Zcash",
  DASH: "Dash",
  EOS: "EOS",
  XTZ: "Tezos",
  THETA: "Theta Network",
  EGLD: "MultiversX",
  FLOW: "Flow",
  KAVA: "Kava",
  MINA: "Mina Protocol",
  CFX: "Conflux",
  FET: "Fetch.ai",
  AGIX: "SingularityNET",
  RNDR: "Render",
  HNT: "Helium",
  QNT: "Quant",
  RUNE: "THORChain",
  KAS: "Kaspa",
  TAO: "Bittensor",
};

/**
 * Get the full name of a cryptocurrency from its ticker symbol
 * @param ticker - The ticker symbol (e.g., "BTC")
 * @returns The full name (e.g., "Bitcoin") or the ticker if not found
 */
export function getCryptoName(ticker: string): string {
  const normalized = ticker.toUpperCase();
  return CRYPTO_NAMES[normalized] || normalized;
}

/**
 * Generate a TradingView symbol string
 * @param ticker - The ticker symbol (e.g., "BTC")
 * @returns TradingView format symbol (e.g., "COINBASE:BTCUSD")
 */
export function getTradingViewSymbol(ticker: string): string {
  const normalized = ticker.toUpperCase();
  return `COINBASE:${normalized}USD`;
}

/**
 * Map timeframe from API format to TradingView format
 * @param timeframe - API timeframe (1d, 1m, 3m, 1y, all)
 * @returns TradingView format (1D, 1M, 3M, 12M, ALL)
 */
export function mapTimeframeToTradingView(timeframe: string): string {
  const mapping: Record<string, string> = {
    "1d": "1D",
    "1m": "1M",
    "3m": "3M",
    "1y": "12M",
    "all": "ALL",
  };
  return mapping[timeframe] || "1M";
}

/**
 * Generate TradingView widget symbols array from coins and timeframe
 * @param coins - Array of ticker symbols
 * @param timeframe - Timeframe string
 * @returns Array of symbol strings for TradingView
 */
export function generateTradingViewSymbols(
  coins: string[],
  timeframe: string
): string[][] {
  const tvTimeframe = mapTimeframeToTradingView(timeframe);
  return coins.map((coin) => [`COINBASE:${coin.toUpperCase()}USD|${tvTimeframe}`]);
}
