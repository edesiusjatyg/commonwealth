import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import get_session
from .schemas import InsightRequest, InsightResponse, UserInsightRecord
from .services import InsightGenerator, ComparisonService
from .utils import get_timeframe_for_analysis, LLMScheduler

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["insights"])

# Initialize services
insight_generator = InsightGenerator()
comparison_service = ComparisonService()


@router.post("/insights", response_model=InsightResponse)
async def generate_insight(
    request: InsightRequest,
    session: AsyncSession = Depends(get_session)
):
    """Generate personalized user insight."""
    try:
        # Check cache
        stmt = select(UserInsightRecord).where(
            UserInsightRecord.user_id == request.user_id,
            UserInsightRecord.insight_type == request.insight_type
        ).order_by(UserInsightRecord.created_at.desc()).limit(1)
        
        result = await session.execute(stmt)
        cached_insight = result.scalars().first()
        
        if cached_insight and not LLMScheduler.should_regenerate_insight(cached_insight.created_at):
            logger.info(f"Returning cached insight for user {request.user_id}")
            return InsightResponse(
                user_id=cached_insight.user_id,
                tokens=request.tokens,
                insight_type=cached_insight.insight_type,
                insight_text=cached_insight.insight_text,
                confidence=cached_insight.confidence / 100.0,
                sources=cached_insight.insight_metadata.get("sources", []) if cached_insight.insight_metadata else [],
                created_at=cached_insight.created_at
            )
        
        # Fetch sentiment data
        timeframe = get_timeframe_for_analysis()
        sentiment_data = await insight_generator.fetch_sentiment_data(
            request.tokens,
            timeframe
        )
        
        # Compare sentiments
        comparison = comparison_service.compare_sentiments(request.tokens, sentiment_data)
        
        # Generate insight
        insight_text, confidence = await insight_generator.generate_insight(
            request.user_id,
            request.tokens,
            sentiment_data,
            request.insight_type
        )
        
        # Store in database
        record = UserInsightRecord(
            user_id=request.user_id,
            portfolio_tokens=request.tokens,
            insight_type=request.insight_type,
            insight_text=insight_text,
            confidence=int(confidence * 100),
            insight_metadata={
                "sources": [sentiment_data],
                "comparison": comparison,
                "timeframe": timeframe
            }
        )
        
        session.add(record)
        await session.commit()
        
        return InsightResponse(
            user_id=request.user_id,
            tokens=request.tokens,
            insight_type=request.insight_type,
            insight_text=insight_text,
            confidence=confidence,
            sources=[sentiment_data],
            created_at=record.created_at
        )
        
    except Exception as e:
        logger.error(f"Failed to generate insight: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/{user_id}")
async def get_user_insights(
    user_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get all insights for a user."""
    try:
        stmt = select(UserInsightRecord).where(
            UserInsightRecord.user_id == user_id
        ).order_by(UserInsightRecord.created_at.desc())
        
        result = await session.execute(stmt)
        insights = result.scalars().all()
        
        return {
            "user_id": user_id,
            "insights": [
                {
                    "type": i.insight_type,
                    "text": i.insight_text,
                    "confidence": i.confidence / 100.0,
                    "created_at": i.created_at
                }
                for i in insights
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))