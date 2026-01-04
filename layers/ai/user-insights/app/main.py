"""
Main FastAPI application for User Insights Service.
Handles endpoints for generating and retrieving user financial insights with temporal comparisons.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional
import logging

from config import settings
from schemas import UserInsight
from services.insight_generator import InsightGenerator
from services.comparison_service import ComparisonService
from app.database import init_db, close_db

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app lifecycle."""
    logger.info("Starting User Insights Service...")
    await init_db()
    yield
    logger.info("Shutting down User Insights Service...")
    await close_db()


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="User Financial Insights Service with weekly and monthly comparisons",
    openapi_url="/docs" if settings.debug else None,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Initialize services
insight_generator = InsightGenerator()
comparison_service = ComparisonService()

# Import routers after app creation
from app.api import router
app.include_router(router)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version
    }


@app.post("/insights/generate", response_model=UserInsight)
async def generate_user_insight(
    user_id: str = Query(..., description="User ID"),
    transactions_data: Optional[dict] = None
) -> UserInsight:
    """
    Generate user financial insights with weekly and monthly comparisons.
    
    - Compares current week with: last week & 2 weeks ago
    - Compares current month with: last month & 2 months ago
    - Returns JSON with all comparison data
    - Data retention: 3 months (90 days) with TTL
    """
    try:
        # Generate insights using LLM and comparison data
        insight = await insight_generator.generate(
            user_id=user_id,
            transactions_data=transactions_data
        )
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


@app.get("/insights/{user_id}", response_model=UserInsight)
async def get_user_insight(user_id: str) -> UserInsight:
    """
    Retrieve the latest user financial insight.
    
    Returns comparison data for:
    - Weekly: last week & 2 weeks ago
    - Monthly: last month & 2 months ago
    """
    try:
        insight = await insight_generator.get_latest(user_id)
        if not insight:
            raise HTTPException(status_code=404, detail="No insight found for this user")
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving insight: {str(e)}")


@app.get("/insights/{user_id}/weekly-comparison")
async def get_weekly_comparison(user_id: str, transactions_data: Optional[dict] = None):
    """Get weekly comparison data (last week & 2 weeks ago)"""
    try:
        # Accept optional transactions payload via query or fetch stored data in future
        # For now, expect client to POST transactions as query body parameter in JSON
        # (FastAPI will pass None when omitted)
        txns = (transactions_data or {}).get("transactions", [])
        comparison = await comparison_service.get_weekly_comparison(user_id, txns)
        if not comparison:
            raise HTTPException(status_code=404, detail="No weekly comparison data available")
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving weekly comparison: {str(e)}")


@app.get("/insights/{user_id}/monthly-comparison")
async def get_monthly_comparison(user_id: str, transactions_data: Optional[dict] = None):
    """Get monthly comparison data (last month & 2 months ago)"""
    try:
        txns = (transactions_data or {}).get("transactions", [])
        comparison = await comparison_service.get_monthly_comparison(user_id, txns)
        if not comparison:
            raise HTTPException(status_code=404, detail="No monthly comparison data available")
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving monthly comparison: {str(e)}")


@app.post("/insights/{user_id}/refresh-llm")
async def refresh_llm_insights(user_id: str):
    """
    Manually trigger LLM update for user insights.
    Normally triggers automatically on weekly and monthly changes.
    """
    try:
        updated_insight = await insight_generator.refresh_with_llm(user_id)
        return {
            "status": "success",
            "message": "LLM insights refreshed",
            "timestamp": updated_insight.llm_last_updated
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing LLM: {str(e)}")


@app.get("/config/retention")
async def get_retention_config():
    """Get data retention configuration"""
    return {
        "data_retention_days": settings.data_retention_days,
        "ttl_description": "Database stores data for 3 months with automatic TTL cleanup",
        "llm_update_frequency": settings.llm_update_frequency,
        "llm_update_description": "LLM is updated every week and month change"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug
    )
