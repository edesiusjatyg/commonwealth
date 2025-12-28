"""
Pydantic models for request/response validation.
"""
from typing import Literal, List
from pydantic import BaseModel, Field, validator


class SentimentRequest(BaseModel):
    """Request model for sentiment analysis endpoint."""
    
    token: str = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Cryptocurrency token ticker (e.g., BTC, ETH)"
    )
    timeframe: str = Field(
        ...,
        description="Timeframe for analysis (e.g., 1d, 7d, 30d)"
    )
    
    @validator("token")
    def token_uppercase(cls, v: str) -> str:
        """Convert token to uppercase."""
        return v.upper().strip()
    
    @validator("timeframe")
    def validate_timeframe(cls, v: str) -> str:
        """Validate timeframe format."""
        valid_timeframes = ["1d", "7d", "14d", "30d"]
        if v not in valid_timeframes:
            raise ValueError(f"Timeframe must be one of: {', '.join(valid_timeframes)}")
        return v


class SourceCitation(BaseModel):
    """Source citation model."""
    
    title: str = Field(..., description="Title of the source")
    url: str = Field(..., description="URL of the source")


class SentimentResponse(BaseModel):
    """Response model for sentiment analysis endpoint."""
    
    sentiment: Literal["bullish", "neutral", "bearish"] = Field(
        ...,
        description="Overall market sentiment from VADER analysis"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0 - 1.0)"
    )
    summary: str = Field(
        ...,
        min_length=1,
        max_length=9000,
        description="Human-readable summary of market discussion"
    )
    cited_sources: List[SourceCitation] = Field(
        ...,
        description="List of sources cited in the analysis"
    )


class HealthResponse(BaseModel):
    """Health check response."""
    
    status: str = "healthy"
    service: str = "market-sentiment-service"
    version: str = "0.1.0"
