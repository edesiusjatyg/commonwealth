"""
API endpoints for sentiment analysis.
"""
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from app.schemas import SentimentRequest, SentimentResponse
from services.langsearch_client import LangSearchClient
from services.sentiment_engine import SentimentEngine
from services.gemini_client import GeminiClient
from services.cache_manager import cache_manager
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Sentiment"])

# Initialize clients
langsearch_client = LangSearchClient(api_key=settings.langsearch_api_key)
gemini_client = GeminiClient(api_key=settings.gemini_api_key)
sentiment_engine = SentimentEngine()


@router.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest) -> SentimentResponse:
    """
    Analyze market sentiment for a given cryptocurrency token.
    """
    try:
        logger.info(f"Analyzing sentiment for {request.token} over {request.timeframe}")
        
        # Get current date for caching check
        current_date = datetime.now().date()
        
        # Step 1: Check sentiment cache FIRST
        # Note: Connection is handled in main.py startup, no need to connect here
        cached_sentiment = await cache_manager.get_sentiment_cache(
            request.token,
            request.timeframe,
            current_date
        )
        
        if cached_sentiment:
            logger.info("Returning cached sentiment result (no LLM call)")
            return SentimentResponse(**cached_sentiment)
        
        # Step 2: No cached sentiment - need to generate fresh analysis
        web_texts = []
        web_sources = []

        # Check for cached articles first
        cached_articles = await cache_manager.get_cached_articles(
            request.token,
            request.timeframe
        )
        
        if cached_articles:
            web_texts, web_sources = cached_articles
            logger.info(f"Using {len(web_texts)} cached articles (no LangSearch call)")
        else:
            # Fetch fresh data from LangSearch
            try:
                web_texts, web_sources = await langsearch_client.search(
                    token=request.token,
                    timeframe=request.timeframe,
                    max_results=settings.max_langsearch_results
                )
                
                if web_texts:
                    logger.info(f"Fetched {len(web_texts)} web results from LangSearch")
                    # Store articles in cache (30-day TTL)
                    articles_to_cache = [
                        {
                            'title': source['title'],
                            'url': source['url'],
                            'content': text,
                            'published_date': source.get('date', 'Unknown')
                        }
                        for text, source in zip(web_texts, web_sources)
                    ]
                    
                    await cache_manager.cache_articles(
                        request.token,
                        request.timeframe,
                        articles_to_cache
                    )
                else:
                    logger.warning(f"LangSearch returned 0 results for {request.token}")

            except Exception as e:
                logger.error(f"LangSearch API error: {str(e)}")
                # Don't crash here, we will handle empty web_texts below
                
        # --- FIX: Handle Empty Results Gracefully ---
        # Instead of raising 503, return a Neutral response so the UI doesn't break
        if not web_texts:
            logger.info("No data found. Returning NEUTRAL fallback.")
            return SentimentResponse(
                sentiment="neutral",
                confidence=0.0,
                summary=f"No recent news or data found for {request.token} in the last {request.timeframe}. Insufficient data for analysis.",
                cited_sources=[]
            )
        
        # Step 3: Perform sentiment analysis
        sentiment_result = sentiment_engine.analyze(web_texts)
        logger.info(f"Sentiment analysis: {sentiment_result}")
        
        # Step 4: Send to Gemini for reasoning
        try:
            gemini_result = await gemini_client.reason_about_sentiment(
                token=request.token,
                timeframe=request.timeframe,
                sentiment_data=sentiment_result,
                sample_texts=sentiment_result.get("all_texts", [])
            )
            logger.info(f"Gemini summary generated: {gemini_result['sentiment']}")
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            # Fallback if Gemini fails
            gemini_result = {
                "sentiment": sentiment_result["sentiment"],
                "summary": "AI reasoning unavailable. Sentiment based on keyword density."
            }
        
        # Step 5: Build response
        response = SentimentResponse(
            sentiment=gemini_result["sentiment"],
            confidence=sentiment_result["confidence"],
            summary=gemini_result["summary"],
            cited_sources=web_sources
        )
        
        try:
            await cache_manager.set_sentiment_cache(
                token=request.token,
                timeframe=request.timeframe,
                query_date=current_date,  # Uses the date variable from top of function
                sentiment=response.sentiment,
                confidence=response.confidence,
                summary=response.summary,
                cited_sources=response.cited_sources
            )
        except Exception as e:
            logger.error(f"Failed to save sentiment to cache: {e}")
        # -----------------------------------------------
        
        logger.info(f"Sentiment analysis completed: {response.sentiment}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in sentiment analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during sentiment analysis"
        )