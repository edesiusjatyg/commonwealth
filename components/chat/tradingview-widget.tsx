"use client";

import { useEffect, useRef, memo } from "react";
import {
  getCryptoName,
  generateTradingViewSymbols,
} from "@/lib/crypto-names";

interface TradingViewWidgetProps {
  coins: string[];
  timeframe: string;
  height?: string;
}

function TradingViewWidgetComponent({
  coins,
  timeframe,
  height = "400px",
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || coins.length === 0) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "calc(100% - 32px)";
    widgetDiv.style.width = "100%";
    widgetContainer.appendChild(widgetDiv);

    // Create copyright div
    const copyrightDiv = document.createElement("div");
    copyrightDiv.className = "tradingview-widget-copyright";

    // Generate copyright links
    const links = coins.map((coin, index) => {
      const name = getCryptoName(coin);
      const link = `<a href="https://www.tradingview.com/symbols/${coin.toUpperCase()}USD/?exchange=COINBASE" rel="noopener nofollow" target="_blank"><span class="blue-text">${name}${index === coins.length - 1 ? " price" : ""}</span></a>`;

      if (index === coins.length - 1) {
        return link;
      } else if (index === coins.length - 2) {
        return `${link}<span class="and">&nbsp;and&nbsp;</span>`;
      } else {
        return `${link}<span class="comma">,</span>&nbsp;`;
      }
    });

    copyrightDiv.innerHTML = `${links.join("")}<span class="trademark">&nbsp;by TradingView</span>`;
    widgetContainer.appendChild(copyrightDiv);

    // Create and configure script
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    const symbols = generateTradingViewSymbols(coins, timeframe);

    script.innerHTML = JSON.stringify({
      lineWidth: 2,
      lineType: 0,
      chartType: "line",
      fontColor: "#707070",
      gridLineColor: "rgba(46, 46, 46, 0.06)",
      volumeUpColor: "rgba(34, 171, 148, 0.5)",
      volumeDownColor: "rgba(247, 82, 95, 0.5)",
      backgroundColor: "#ffffff",
      widgetFontColor: "#0F0F0F",
      upColor: "#22ab94",
      downColor: "#f7525f",
      borderUpColor: "#22ab94",
      borderDownColor: "#f7525f",
      wickUpColor: "#22ab94",
      wickDownColor: "#f7525f",
      colorTheme: "light",
      isTransparent: false,
      locale: "en",
      chartOnly: true,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      valuesTracking: "1",
      changeMode: "price-and-percent",
      symbols: symbols,
      dateRanges: [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M",
      ],
      fontSize: "9",
      headerFontSize: "small",
      autosize: true,
      width: "100%",
      height: "100%",
      noTimeScale: false,
      hideDateRanges: false,
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [coins, timeframe]);

  if (coins.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%" }}
      className="rounded-lg overflow-hidden border border-gray-200"
    />
  );
}

export const TradingViewWidget = memo(TradingViewWidgetComponent);
