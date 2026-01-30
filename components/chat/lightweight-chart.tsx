"use client";

import { useEffect, useRef, memo } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, LineData, Time, LineSeries } from "lightweight-charts";
import { getCryptoName } from "@/lib/crypto-names";

interface LightweightChartProps {
  coins: string[];
  timeframe: string;
  height?: string;
}

// Colors for multiple coins
const CHART_COLORS = [
  "#8B5CF6", // Purple
  "#22AB94", // Green
  "#F7525F", // Red
  "#3B82F6", // Blue
  "#F59E0B", // Amber
];

// Timeframe to API interval mapping
function mapTimeframeToInterval(timeframe: string): { interval: string; days: number } {
  switch (timeframe) {
    case "1d": return { interval: "hourly", days: 1 };
    case "1m": return { interval: "daily", days: 30 };
    case "3m": return { interval: "daily", days: 90 };
    case "1y": return { interval: "daily", days: 365 };
    case "all": return { interval: "daily", days: 1825 }; // ~5 years
    default: return { interval: "daily", days: 30 };
  }
}

function LightweightChartComponent({ coins, timeframe, height = "200px" }: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  useEffect(() => {
    if (!containerRef.current || coins.length === 0) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#707070",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(46, 46, 46, 0.06)" },
        horzLines: { color: "rgba(46, 46, 46, 0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(46, 46, 46, 0.1)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(46, 46, 46, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "#8B5CF6", width: 1, style: 2 },
        horzLine: { color: "#8B5CF6", width: 1, style: 2 },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    // Fetch and display data for each coin
    const fetchData = async () => {
      const { days } = mapTimeframeToInterval(timeframe);

      for (let i = 0; i < coins.length; i++) {
        const coin = coins[i].toLowerCase();
        const color = CHART_COLORS[i % CHART_COLORS.length];

        try {
          // Fetch from CoinGecko API
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${getCoinGeckoId(coin)}/market_chart?vs_currency=usd&days=${days}`
          );

          if (!response.ok) continue;

          const data = await response.json();
          const prices = data.prices as [number, number][];

          // Convert to lightweight-charts format
          const lineData: LineData<Time>[] = prices.map(([timestamp, price]) => ({
            time: (timestamp / 1000) as Time,
            value: price,
          }));

          // Create line series using addSeries
          const series = chart.addSeries(LineSeries, {
            color,
            lineWidth: 2,
            title: coins[i].toUpperCase(),
            priceFormat: { type: "price", precision: 2, minMove: 0.01 },
          });

          series.setData(lineData);
          seriesRef.current.set(coin, series);

        } catch (error) {
          console.error(`Failed to fetch data for ${coin}:`, error);
        }
      }

      chart.timeScale().fitContent();
    };

    fetchData();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      seriesRef.current.clear();
    };
  }, [coins, timeframe]);

  if (coins.length === 0) return null;

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
      <div ref={containerRef} style={{ height, width: "100%" }} />
      <div className="px-2 py-1 text-[10px] text-gray-400 border-t border-gray-100 flex items-center gap-1 flex-wrap">
        {coins.map((coin, i) => (
          <span key={coin} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span>{getCryptoName(coin)}</span>
            {i < coins.length - 1 && <span className="mx-1">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// Map common tickers to CoinGecko IDs
function getCoinGeckoId(ticker: string): string {
  const map: Record<string, string> = {
    btc: "bitcoin",
    eth: "ethereum",
    sol: "solana",
    xrp: "ripple",
    ada: "cardano",
    doge: "dogecoin",
    dot: "polkadot",
    link: "chainlink",
    avax: "avalanche-2",
    matic: "matic-network",
    shib: "shiba-inu",
    ltc: "litecoin",
    uni: "uniswap",
    atom: "cosmos",
    near: "near",
    bch: "bitcoin-cash",
    xlm: "stellar",
    fil: "filecoin",
    apt: "aptos",
    arb: "arbitrum",
    op: "optimism",
    sui: "sui",
    aave: "aave",
    mkr: "maker",
    grt: "the-graph",
    inj: "injective-protocol",
    trx: "tron",
    ton: "the-open-network",
    icp: "internet-computer",
    vet: "vechain",
    ftm: "fantom",
    algo: "algorand",
    pepe: "pepe",
    render: "render-token",
    imx: "immutable-x",
    stx: "stacks",
    sei: "sei-network",
    tia: "celestia",
    jup: "jupiter-ag",
    wld: "worldcoin-wld",
    crv: "curve-dao-token",
    ldo: "lido-dao",
    sand: "the-sandbox",
    mana: "decentraland",
    axs: "axie-infinity",
    ape: "apecoin",
    gala: "gala",
    ens: "ethereum-name-service",
    snx: "havven",
    comp: "compound-governance-token",
    kas: "kaspa",
    tao: "bittensor",
  };
  return map[ticker.toLowerCase()] || ticker.toLowerCase();
}

export const LightweightChart = memo(LightweightChartComponent);
