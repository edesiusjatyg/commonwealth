"""
DuckDuckGo Search API client for fetching crypto-related web content.
"""
import logging
from typing import List, Dict, Any
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
    
    async def search(
        self,
        token: str,
        max_results: int = 20
    ) -> tuple[List[str], List[Dict[str, str]]]:
        """
        Search DuckDuckGo for crypto-related content.
        
        Args:
            token: Cryptocurrency token ticker (e.g., BTC, ETH)
            max_results: Maximum number of results to fetch
            
        Returns:
            Tuple of (text snippets, source citations with title and url)
            
        Raises:
            Exception: If API request fails
        """
        if not self.api_key:
            logger.warning("DuckDuckGo API key not configured")
            return []
        
        try:
            # Build search query
            query = f"{token} cryptocurrency blockchain news"
            
            # API parameters
            params = {
                "engine": "duckduckgo",
                "q": query,
                "api_key": self.api_key,
                "num": min(max_results, 50)  # Limit results
            }
            
            # Make API request
            async with httpx.AsyncClient(timeout=30.0) as client:
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
                
                # Also try to get additional context if available
                description = result.get("description", "")
                displayed_link = result.get("displayed_link", "")
                
                # Combine all text for richer context
                # Use snippet and description if both are available
                text_parts = [title]
                
                if snippet:
                    text_parts.append(snippet)
                
                if description and description != snippet:
                    text_parts.append(description)
                
                combined_text = " ".join(text_parts).strip()
                
                if combined_text:
                    texts.append(combined_text)
                    sources.append({
                        "title": title if title else displayed_link,
                        "url": url
                    })
            
            logger.info(f"Fetched {len(texts)} search results for {token}")
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
