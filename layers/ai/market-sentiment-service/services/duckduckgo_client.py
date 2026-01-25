"""
DuckDuckGo Search API client for fetching crypto-related web content.
"""
import logging
import re
from typing import List, Dict, Any
from datetime import datetime, timedelta
import httpx

logger = logging.getLogger(__name__)


class DuckDuckGoClient:
    """Client for interacting with DuckDuckGo Search API via SearchAPI.io."""
    
    BASE_URL = "https://www.searchapi.io/api/v1/search"
    
    def __init__(self, api_key: str):
        """
        Initialize DuckDuckGo client.
        
        Args:
            api_key: SearchAPI.io API key
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
    def get_time_filter(timeframe: str) -> str:
        """
        Convert timeframe to DuckDuckGo time filter.
        
        Args:
            timeframe: Timeframe string (3d, 15d, 30d)
            
        Returns:
            Time filter string for DuckDuckGo
        """
        # Map timeframe to days
        days_map = {
            "3d": "3",
            "15d": "15",
            "30d": "30"
        }
        return days_map.get(timeframe, "30")
    
    async def search(
        self,
        token: str,
        timeframe: str,
        max_results: int = 20
    ) -> tuple[List[str], List[Dict[str, str]]]:
        """
        Search DuckDuckGo for crypto-related content with timeframe filtering.
        
        Args:
            token: Cryptocurrency token ticker (e.g., BTC, ETH)
            timeframe: Timeframe for search (3d, 15d, 30d)
            max_results: Maximum number of results to fetch
            
        Returns:
            Tuple of (text snippets, source citations with title and url)
            
        Raises:
            Exception: If API request fails
        """
        if not self.api_key:
            logger.warning("DuckDuckGo API key not configured")
            return [], []
        
        try:
            # Get time filter
            time_filter = self.get_time_filter(timeframe)
            
            # Build search query with timeframe context
            query = f"{token} cryptocurrency blockchain news past {time_filter} days"
            
            # API parameters with time filter
            params = {
                "engine": "duckduckgo",
                "q": query,
                "api_key": self.api_key,
                "num": min(max_results, 50),  # Limit results
                "time": f"d{time_filter}"  # Time filter (d3, d15, d30)
            }
            
            # Make API request with reduced timeout for security
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
            
            # Extract text from results
            texts = []
            sources = []
            organic_results = data.get("organic_results", [])
            
            for result in organic_results[:max_results]:
                # Get all available text fields for more context
                title = result.get("title", "")
                snippet = result.get("snippet", "")
                url = result.get("link", "")
                description = result.get("description", "")
                displayed_link = result.get("displayed_link", "")
                date = result.get("date", "")  # Get article date if available
                
                # Sanitize all text to prevent prompt injection
                title = self.sanitize_text(title)
                snippet = self.sanitize_text(snippet)
                description = self.sanitize_text(description)
                
                # Combine all text for richer context
                text_parts = []
                
                if title:
                    text_parts.append(title)
                
                if snippet:
                    text_parts.append(snippet)
                
                if description and description != snippet:
                    text_parts.append(description)
                
                # Add date context if available
                if date:
                    text_parts.append(f"Published: {date}")
                
                combined_text = " ".join(text_parts).strip()
                
                if combined_text:
                    texts.append(combined_text)
                    sources.append({
                        "title": title if title else displayed_link,
                        "url": url,
                        "date": date if date else "Unknown"
                    })
            
            logger.info(f"Fetched {len(texts)} search results for {token} ({timeframe})")
            return texts, sources
            
        except httpx.HTTPStatusError as e:
            logger.error(f"DuckDuckGo API HTTP error: {e.response.status_code}")
            raise Exception(f"Failed to fetch search results: HTTP {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"DuckDuckGo API request error: {str(e)}")
            raise Exception(f"Failed to fetch search results: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in DuckDuckGo search: {str(e)}")
            raise
