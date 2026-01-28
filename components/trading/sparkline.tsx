'use client';

import { memo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

function SparklineComponent({ data, width = 60, height = 24, positive = true }: SparklineProps) {
  if (!data || data.length < 2) {
    // Generate fake data from price movement
    return <div style={{ width, height }} className="bg-muted/30 rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize points to SVG coordinates
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const Sparkline = memo(SparklineComponent);

// Generate fake sparkline data based on price change
export function generateSparklineData(change24h: number): number[] {
  const trend = change24h >= 0 ? 1 : -1;
  const volatility = Math.abs(change24h) / 10;
  const points: number[] = [];
  let value = 100;

  for (let i = 0; i < 12; i++) {
    // Add some randomness with general trend direction
    const random = (Math.random() - 0.5) * volatility * 2;
    const trendPush = trend * (i / 12) * Math.abs(change24h) * 0.5;
    value = 100 + trendPush + random;
    points.push(value);
  }

  // Ensure last point reflects the actual trend
  points[points.length - 1] = 100 + change24h;

  return points;
}
