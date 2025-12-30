"""
Sentiment analysis engine using VADER for text sentiment scoring.
"""
import logging
from typing import List, Dict, Any
from collections import Counter
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)


class SentimentEngine:
    """Engine for analyzing sentiment of text data."""
    
    def __init__(self):
        """Initialize sentiment analyzer."""
        self.analyzer = SentimentIntensityAnalyzer()
    
    def analyze(self, texts: List[str]) -> Dict[str, Any]:
        """
        Analyze sentiment of a collection of texts.
        """
        if not texts:
            logger.warning("No texts provided for sentiment analysis")
            return {
                "sentiment_counts": {"positive": 0, "neutral": 0, "negative": 0},
                "confidence": 0.0,
                "top_samples": [],
                "avg_compound_score": 0.0,
                "all_texts": [] 
            }
        
        # Deduplicate texts
        unique_texts = list(set(texts))
        logger.info(f"Analyzing {len(unique_texts)} unique texts")
        
        sentiment_scores = []
        sentiment_labels = []
        scored_texts = []
        
        for text in unique_texts:
            if not text or len(text.strip()) < 10:
                continue
            
            scores = self.analyzer.polarity_scores(text)
            compound = scores["compound"]
            
            # Classify sentiment
            if compound >= 0.05:
                label = "positive"
            elif compound <= -0.05:
                label = "negative"
            else:
                label = "neutral"
            
            sentiment_scores.append(compound)
            sentiment_labels.append(label)
            
            # --- FIX: REMOVED TRUNCATION HERE ---
            # Gemini needs the full text to reason correctly.
            # Do NOT use text[:200] here.
            scored_texts.append({
                "text": text,  
                "score": compound,
                "label": label
            })
        
        # Count sentiment distribution
        sentiment_counts = Counter(sentiment_labels)
        total_count = len(sentiment_labels)
        
        # Calculate confidence
        if total_count > 0:
            max_count = max(sentiment_counts.values())
            confidence = max_count / total_count
        else:
            confidence = 0.0
        
        # Calculate average compound score
        avg_compound = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
        
        # Select top representative samples
        top_samples = self._select_representative_samples(scored_texts, max_samples=10)
        
        # OPTIONAL: If you want to truncate top_samples for the frontend, do it here
        # But for 'all_texts', we preserve the full content for Gemini
        
        result = {
            "sentiment_counts": {
                "positive": sentiment_counts.get("positive", 0),
                "neutral": sentiment_counts.get("neutral", 0),
                "negative": sentiment_counts.get("negative", 0)
            },
            "confidence": round(confidence, 2),
            "top_samples": top_samples,
            "all_texts": scored_texts,  # This now contains FULL summaries for Gemini
            "avg_compound_score": round(avg_compound, 3)
        }
        
        logger.info(f"Sentiment analysis: {result['sentiment_counts']}, confidence: {result['confidence']}")
        return result
    
    @staticmethod
    def _select_representative_samples(
        scored_texts: List[Dict[str, Any]],
        max_samples: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Select representative text samples from each sentiment category.
        """
        # Group by sentiment label
        by_label = {"positive": [], "neutral": [], "negative": []}
        
        for item in scored_texts:
            label = item["label"]
            if label in by_label:
                by_label[label].append(item)
        
        # Sort each group by absolute score (most extreme first)
        for label in by_label:
            by_label[label].sort(key=lambda x: abs(x["score"]), reverse=True)
        
        # Select samples evenly from each category
        samples = []
        per_category = max(1, max_samples // 3)
        
        for label in ["positive", "negative", "neutral"]:
            samples.extend(by_label[label][:per_category])
        
        return samples[:max_samples]