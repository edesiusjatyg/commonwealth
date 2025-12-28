"""
API endpoints for sentiment analysis.
"""
import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas import SentimentRequest, SentimentResponse
from services.duckduckgo_client import DuckDuckGoClient
from services.sentiment_engine import SentimentEngine
from services.gemini_client import GeminiClient
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Sentiment"])

# Initialize clients
duckduckgo_client = DuckDuckGoClient(api_key=settings.duckduckgo_api_key)
gemini_client = GeminiClient(api_key=settings.gemini_api_key)
sentiment_engine = SentimentEngine()


@router.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest) -> SentimentResponse:
    """
    Analyze market sentiment for a given cryptocurrency token.
    
    Args:
        request: SentimentRequest containing token and timeframe
        
    Returns:
        SentimentResponse with sentiment analysis results
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        logger.info(f"Analyzing sentiment for {request.token} over {request.timeframe}")
        
        # Step 1: Fetch data from DuckDuckGo
        web_texts = []
        web_sources = []
        try:
            web_texts, web_sources = await duckduckgo_client.search(
                token=request.token,
                max_results=settings.max_duckduckgo_results
            )
            logger.info(f"Fetched {len(web_texts)} web results")
        except Exception as e:
            logger.error(f"DuckDuckGo API error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to fetch data from DuckDuckGo"
            )
        
        # Check if we have any data
        if not web_texts:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No data available for analysis"
            )
        
        # Step 2: Perform sentiment analysis
        sentiment_result = sentiment_engine.analyze(web_texts)
        
        logger.info(f"Sentiment analysis: {sentiment_result}")
        
        # Step 3: Send to Gemini for reasoning
        try:
            gemini_result = await gemini_client.reason_about_sentiment(
                token=request.token,
                sentiment_data=sentiment_result,
                sample_texts=sentiment_result.get("all_texts", [])  # Use ALL texts
            )
            logger.info("Gemini summary generated")
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate sentiment summary"
            )
        
        # Step 4: Build response
        response = SentimentResponse(
            sentiment=gemini_result["sentiment"],
            confidence=sentiment_result["confidence"],
            summary=gemini_result["summary"],
            cited_sources=web_sources
        )
        
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
