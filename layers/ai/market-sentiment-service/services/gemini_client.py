"""
Gemini LLM client for reasoning about market sentiment.
"""
import logging
import json
from typing import Dict, Any, List
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    """Client for interacting with Google Gemini API."""
    
    def __init__(self, api_key: str):
        """
        Initialize Gemini client.
        
        Args:
            api_key: Google Gemini API key
        """
        self.api_key = api_key
        
        if self.api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                model_name=settings.gemini_model,
                generation_config={
                    "temperature": settings.gemini_temperature,
                    "max_output_tokens": settings.gemini_max_tokens,
                }
            )
        else:
            self.model = None
            logger.warning("Gemini API key not configured")
    
    async def reason_about_sentiment(
        self,
        token: str,
        sentiment_data: Dict[str, Any],
        sample_texts: List[Dict[str, Any]]
    ) -> Dict[str, str]:
        """
        Use Gemini to generate a summary of sentiment.
        
        Args:
            token: Cryptocurrency token ticker
            sentiment_data: Sentiment analysis results from SentimentEngine
            sample_texts: Representative text samples
            
        Returns:
            Dictionary with:
                - sentiment: "bullish" | "neutral" | "bearish" (from VADER)
                - summary: Human-readable summary
                
        Raises:
            Exception: If API request fails
        """
        if not self.model:
            raise Exception("Gemini client not initialized")
        
        try:
            # Determine sentiment from VADER scores
            sentiment = self._determine_sentiment(sentiment_data)
            
            # Load system prompt
            system_prompt = self._load_system_prompt()
            
            # Build structured input
            user_input = self._build_input(token, sentiment_data, sample_texts)
            
            # Combine system prompt and user input
            full_prompt = f"{system_prompt}\n\n{user_input}"
            
            # Generate response
            logger.info("Sending request to Gemini API")
            response = self.model.generate_content(full_prompt)
            
            if not response or not response.text:
                raise Exception("Empty response from Gemini API")
            
            # Use the response text as summary directly
            summary = response.text.strip()
            
            # Truncate if too long
            if len(summary) > 500:
                summary = summary[:497] + "..."
            
            result = {
                "sentiment": sentiment,
                "summary": summary
            }
            
            logger.info(f"Gemini reasoning completed: {sentiment}")
            return result
            
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise
    
    @staticmethod
    def _load_system_prompt() -> str:
        """
        Load system prompt from file.
        
        Returns:
            System prompt text
        """
        try:
            with open("prompts/market_reasoning.txt", "r") as f:
                return f.read()
        except FileNotFoundError:
            logger.warning("System prompt file not found, using default")
            return """You are a crypto market sentiment analyzer. Your role is to summarize public information about cryptocurrency market sentiment.

IMPORTANT: You are NOT providing financial advice. You are only summarizing publicly available sentiment data.

You will receive:
1. Sentiment counts (positive, neutral, negative)
2. Confidence score
3. Sample texts from web sources

Your task:
Write a concise summary (max 200 words) explaining what people are discussing about this cryptocurrency.

Focus on:
- Key themes and topics
- What's driving the sentiment
- Any notable concerns

Do NOT predict prices or give investment advice.
Output ONLY the summary text, nothing else."""
    
    @staticmethod
    def _determine_sentiment(sentiment_data: Dict[str, Any]) -> str:
        """
        Determine overall sentiment from VADER analysis.
        
        Args:
            sentiment_data: Sentiment analysis results
            
        Returns:
            "bullish", "neutral", or "bearish"
        """
        avg_score = sentiment_data.get("avg_compound_score", 0.0)
        counts = sentiment_data.get("sentiment_counts", {})
        
        # Use average compound score as primary indicator
        if avg_score >= 0.1:
            return "bullish"
        elif avg_score <= -0.1:
            return "bearish"
        else:
            # If neutral, check distribution
            positive = counts.get("positive", 0)
            negative = counts.get("negative", 0)
            
            if positive > negative * 1.5:
                return "bullish"
            elif negative > positive * 1.5:
                return "bearish"
            else:
                return "neutral"
    
    @staticmethod
    def _build_input(
        token: str,
        sentiment_data: Dict[str, Any],
        sample_texts: List[Dict[str, Any]]
    ) -> str:
        """
        Build structured input for Gemini.
        
        Args:
            token: Token ticker
            sentiment_data: Sentiment analysis results
            sample_texts: Sample texts
            
        Returns:
            Formatted input string
        """
        # Build input JSON
        input_data = {
            "token": token,
            "sentiment_analysis": {
                "counts": sentiment_data["sentiment_counts"],
                "confidence": sentiment_data["confidence"],
                "avg_score": sentiment_data["avg_compound_score"]
            },
            "sample_texts": [
                {
                    "text": item["text"],
                    "label": item["label"]
                }
                for item in sample_texts[:8]  # Limit samples to reduce tokens
            ]
        }
        
        return f"Analyze the following sentiment data and provide your assessment:\n\n{json.dumps(input_data, indent=2)}"
