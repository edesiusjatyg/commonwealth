"""
LangSearch API client for fetching crypto-related web content.
"""
import logging
import re
from typing import List, Dict, Any
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class LangSearchClient:
    """Client for interacting with LangSearch API."""
    
    BASE_URL = "https://api.langsearch.com/v1/web-search"
    
    def __init__(self, api_key: str):
        """
        Initialize LangSearch client.
        
        Args:
            api_key: LangSearch API key
        """
        self.api_key = api_key
    
    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Sanitize text to prevent prompt injection and remove unwanted characters.
        Keeps only safe characters: letters, numbers, spaces, and basic punctuation.
        
        Args:
            text: Raw text to sanitize
            
        Returns:
            Sanitized text
        """
        # Remove all characters except alphanumeric, spaces, and safe punctuation
        # Allow: a-z A-Z 0-9 space . , ! ? - ' "
        sanitized = re.sub(r'[^a-zA-Z0-9\s.,!?\-\'"]', ' ', text)
        
        # Collapse multiple spaces
        sanitized = re.sub(r'\s+', ' ', sanitized)
        
        return sanitized.strip()
    
    @staticmethod
    def get_freshness_filter(timeframe: str) -> str:
        """
        Convert timeframe to LangSearch freshness filter.
        
        Args:
            timeframe: Timeframe string (1d, 7d, 30d, 365d)
            
        Returns:
            Freshness filter string for LangSearch
        """
        # Map to LangSearch's available options only
        if timeframe == "1d":
            return "oneDay"
        elif timeframe == "7d":
            return "oneWeek"
        elif timeframe == "30d":
            return "oneMonth"
        elif timeframe == "365d":
            return "oneYear"
        else:
            return "oneMonth"  # Default
    
    @staticmethod
    def build_query(token: str, timeframe: str) -> str:
        """
        Build a search query optimized for crypto sentiment.
        """
        # Base query focusing on news and sentiment
        base_query = f"{token} crypto news sentiment market outlook"
        
        # Add exclusion operators to remove encyclopedic noise
        # This tells the search engine explicitly: "Don't show me Wikipedia"
        exclusions = "-site:wikipedia.org -site:wiktionary.org -site:coinmarketcap.com -site:coingecko.com"
        
        return f"{base_query} {exclusions}"
    
    async def search(
        self,
        token: str,
        timeframe: str,
        max_results: int = 5
    ) -> tuple[List[str], List[Dict[str, str]]]:
        """
        Search LangSearch for crypto-related content with timeframe filtering.
        """
        if not self.api_key:
            logger.warning("LangSearch API key not configured")
            return [], []
        
        try:
            # Get freshness filter and build query
            freshness = LangSearchClient.get_freshness_filter(timeframe)
            query = LangSearchClient.build_query(token, timeframe)
            
            logger.info(f"LangSearch query: '{query}' with freshness: {freshness}")
            
            # Build request payload
            payload = {
                "query": query,
                "freshness": freshness,
                "summary": True,
                "count": min(max_results, 10)
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
            
            # --- FIX STARTS HERE ---
            texts = []
            sources = []
            
            # Navigate the JSON structure: data -> webPages -> value
            results = data.get("data", {}).get("webPages", {}).get("value", [])
            
            logger.info(f"LangSearch returned {len(results)} results")
            
            for result in results[:max_results]:
                # Map fields according to the documentation
                title = result.get("name", "")      # API uses "name", not "title"
                snippet = result.get("snippet", "")
                summary = result.get("summary", "")
                url = result.get("url", "")

                if "wikipedia.org" in url or "wiktionary.org" in url:
                    continue
                
                raw_date = result.get("datePublished")
                published_date = raw_date if raw_date else "Unknown"
                # Sanitize text
                title = self.sanitize_text(title)
                snippet = self.sanitize_text(snippet)
                summary = self.sanitize_text(summary)
                
                # Combine text
                text_parts = []
                if title:
                    text_parts.append(f"Title: {title}")
                
                if summary:
                    text_parts.append(f"Content: {summary}")
                elif snippet:
                    text_parts.append(f"Content: {snippet}")
                
                if published_date and published_date != "Unknown":
                    text_parts.append(f"Published: {published_date}")
                
                combined_text = " ".join(text_parts).strip()
                
                if combined_text and url:
                    texts.append(combined_text)
                    sources.append({
                        "title": title if title else "Untitled",
                        "url": url,
                        "date": published_date
                    })
            # --- FIX ENDS HERE ---
            
            logger.info(f"Processed {len(texts)} search results for {token} ({timeframe})")
            return texts, sources
            
        except httpx.HTTPStatusError as e:
            logger.error(f"LangSearch API HTTP error: {e.response.status_code}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise Exception(f"Failed to fetch search results: HTTP {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"LangSearch API request error: {str(e)}")
            raise Exception(f"Failed to fetch search results: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in LangSearch search: {str(e)}")
            raise