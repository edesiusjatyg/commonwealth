'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AISentimentCardProps {
  symbol: string;
  name: string;
  timeframe?: '1d' | '7d' | '30d' | '365d';
}

interface Source {
  title: string;
  url: string;
  date: string;
}

interface SentimentData {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  sources: Source[];
}

export function AISentimentCard({ symbol, name, timeframe = '1d' }: AISentimentCardProps) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchSentiment = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/ai/sentiment?crypto=${symbol}&timeframe=${timeframe}`);
        const result = await res.json();
        
        if (result.success && result.sentiment) {
          let sentimentType: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          const sentimentStr = result.sentiment.toLowerCase();
          if (sentimentStr === 'bullish' || sentimentStr.includes('bullish')) {
            sentimentType = 'bullish';
          } else if (sentimentStr === 'bearish' || sentimentStr.includes('bearish')) {
            sentimentType = 'bearish';
          }
          
          setData({
            sentiment: sentimentType,
            confidence: Math.round((result.confidence || 0) * 100),
            summary: result.summary || result.sentiment,
            sources: result.sources || [],
          });
        } else {
          setError('AI sentiment temporarily unavailable');
        }
      } catch (err) {
        setError('Failed to load AI insights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentiment();
  }, [symbol, timeframe]);

  const getSentimentIcon = () => {
    if (!data) return <Brain className="h-5 w-5" />;
    switch (data.sentiment) {
      case 'bullish': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-5 w-5 text-red-500" />;
      default: return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = () => {
    if (!data) return 'border-border bg-card';
    switch (data.sentiment) {
      case 'bullish': return 'border-green-500/30 bg-green-500/5';
      case 'bearish': return 'border-red-500/30 bg-red-500/5';
      default: return 'border-yellow-500/30 bg-yellow-500/5';
    }
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '1d': return '24 Hours';
      case '7d': return '7 Days';
      case '30d': return '30 Days';
      case '365d': return '1 Year';
      default: return timeframe;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className={cn("overflow-hidden transition-colors", getSentimentColor())}>
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-start gap-3 text-left"
        >
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : error ? (
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            ) : (
              getSentimentIcon()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-sm">Nostradamus</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {getTimeframeLabel()}
              </span>
              {data && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  data.sentiment === 'bullish' && "bg-green-500/20 text-green-500",
                  data.sentiment === 'bearish' && "bg-red-500/20 text-red-500",
                  data.sentiment === 'neutral' && "bg-yellow-500/20 text-yellow-500"
                )}>
                  {data.sentiment.toUpperCase()}
                </span>
              )}
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            ) : error ? (
              <p className="text-sm text-muted-foreground">{error}</p>
            ) : data ? (
              <>
                {/* Confidence Bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        data.sentiment === 'bullish' && "bg-green-500",
                        data.sentiment === 'bearish' && "bg-red-500",
                        data.sentiment === 'neutral' && "bg-yellow-500"
                      )}
                      style={{ width: `${data.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {data.confidence}% confidence
                  </span>
                </div>
                
                {/* Preview Summary - only show when collapsed */}
                {!isExpanded && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {data.summary}
                  </p>
                )}
              </>
            ) : null}
          </div>
          
          {/* Expand Toggle */}
          <div className="shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && data && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Full Summary */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-foreground leading-relaxed">
                    {data.summary}
                  </p>
                </div>
                
                {/* Sources */}
                {data.sources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Sources
                    </h4>
                    <div className="space-y-1">
                      {data.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary" />
                          <span className="text-xs text-muted-foreground group-hover:text-foreground line-clamp-1">
                            {source.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
          <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Powered by Nostradamus AI
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
