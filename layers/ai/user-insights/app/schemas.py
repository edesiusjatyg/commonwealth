from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, JSON, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()


# Database Models
class UserInsightRecord(Base):
    """Database model for user insights."""
    __tablename__ = "user_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    portfolio_tokens = Column(JSON, nullable=True)  # List of tokens user holds
    insight_type = Column(String(50), nullable=False)  # "portfolio", "sentiment_driven", etc
    insight_text = Column(String(2000), nullable=False)
    confidence = Column(Integer, nullable=True)  # 0-100
    metadata = Column(JSON, nullable=True)  # Additional context
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Request/Response Schemas
class InsightRequest(BaseModel):
    """Request model for generating user insights."""
    user_id: str = Field(..., min_length=1, max_length=255)
    tokens: List[str] = Field(..., min_items=1, max_items=20)
    insight_type: str = Field(
        "portfolio",
        description="Type of insight: portfolio, sentiment_driven, risk_analysis"
    )


class SourceInsight(BaseModel):
    """Insight from sentiment source."""
    token: str
    sentiment: str
    confidence: float
    summary: str


class InsightResponse(BaseModel):
    """Response model for user insights."""
    user_id: str
    tokens: List[str]
    insight_type: str
    insight_text: str
    confidence: float
    sources: List[Dict[str, Any]]
    created_at: datetime


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    service: str = "user-insights-service"
    version: str = "0.1.0"


class PeriodComparison(BaseModel):
    """Comparison data for a specific period"""
    current_value: float = Field(..., description="Current period value")
    previous_value: float = Field(..., description="Previous period value")
    change_percentage: float = Field(..., description="Percentage change from previous period")
    change_amount: float = Field(..., description="Absolute change amount")


class WeeklyComparison(BaseModel):
    """Weekly data comparison"""
    last_week: PeriodComparison = Field(..., description="Comparison with last week")
    two_weeks_ago: PeriodComparison = Field(..., description="Comparison with 2 weeks ago")


class MonthlyComparison(BaseModel):
    """Monthly data comparison"""
    last_month: PeriodComparison = Field(..., description="Comparison with last month")
    two_months_ago: PeriodComparison = Field(..., description="Comparison with 2 months ago")


class CategoryComparison(BaseModel):
    """Category-level comparisons"""
    category_name: str = Field(..., description="Category name")
    weekly: Optional[WeeklyComparison] = Field(None, description="Weekly comparison for this category")
    monthly: Optional[MonthlyComparison] = Field(None, description="Monthly comparison for this category")


class UserInsightDetail(BaseModel):
    """User financial insight with temporal comparisons"""
    timestamp: datetime = Field(..., description="Timestamp when insight was generated")
    data_retention_days: int = Field(default=90, description="Database stores data for 3 months (90 days) with TTL")
    
    # Overall comparisons
    overall_spending: Dict[str, Any] = Field(..., description="Overall spending comparison data")
    overall_income: Dict[str, Any] = Field(..., description="Overall income comparison data")
    
    # Weekly comparisons
    weekly_comparison: WeeklyComparison = Field(..., description="Weekly spending comparison")
    
    # Monthly comparisons
    monthly_comparison: MonthlyComparison = Field(..., description="Monthly spending comparison")
    
    # Category-level insights
    category_insights: List[CategoryComparison] = Field(default_factory=list, description="Per-category comparisons")
    
    # Insights and trends
    insights: List[str] = Field(default_factory=list, description="Key insights based on comparisons")
    trends: List[str] = Field(default_factory=list, description="Trend analysis")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations")
    
    # LLM update tracking
    llm_last_updated: datetime = Field(..., description="Last time LLM was updated")
    llm_update_frequency: str = Field(default="weekly_and_monthly", description="LLM updates every week and month change")
    
    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2025-01-03T10:00:00Z",
                "data_retention_days": 90,
                "overall_spending": {
                    "weekly": {
                        "current": 100000,
                        "change_percentage": 5.5
                    },
                    "monthly": {
                        "current": 450000,
                        "change_percentage": -2.3
                    }
                },
                "overall_income": {
                    "weekly": {
                        "current": 200000,
                        "change_percentage": 0
                    },
                    "monthly": {
                        "current": 900000,
                        "change_percentage": 3.2
                    }
                },
                "weekly_comparison": {
                    "last_week": {
                        "current_value": 100000,
                        "previous_value": 95000,
                        "change_percentage": 5.26,
                        "change_amount": 5000
                    },
                    "two_weeks_ago": {
                        "current_value": 100000,
                        "previous_value": 92000,
                        "change_percentage": 8.7,
                        "change_amount": 8000
                    }
                },
                "monthly_comparison": {
                    "last_month": {
                        "current_value": 450000,
                        "previous_value": 460000,
                        "change_percentage": -2.17,
                        "change_amount": -10000
                    },
                    "two_months_ago": {
                        "current_value": 450000,
                        "previous_value": 440000,
                        "change_percentage": 2.27,
                        "change_amount": 10000
                    }
                },
                "category_insights": [
                    {
                        "category_name": "Food & Dining",
                        "weekly": {
                            "last_week": {
                                "current_value": 30000,
                                "previous_value": 28000,
                                "change_percentage": 7.14,
                                "change_amount": 2000
                            },
                            "two_weeks_ago": {
                                "current_value": 30000,
                                "previous_value": 25000,
                                "change_percentage": 20,
                                "change_amount": 5000
                            }
                        },
                        "monthly": {
                            "last_month": {
                                "current_value": 135000,
                                "previous_value": 140000,
                                "change_percentage": -3.57,
                                "change_amount": -5000
                            },
                            "two_months_ago": {
                                "current_value": 135000,
                                "previous_value": 130000,
                                "change_percentage": 3.85,
                                "change_amount": 5000
                            }
                        }
                    }
                ],
                "insights": [
                    "Spending increased 5.26% compared to last week",
                    "Monthly spending decreased 2.17% compared to last month"
                ],
                "trends": [
                    "Upward trend in weekly spending",
                    "Stable monthly spending pattern"
                ],
                "recommendations": [
                    "Monitor food spending increase",
                    "Consider budget review for next month"
                ],
                "llm_last_updated": "2025-01-03T10:00:00Z",
                "llm_update_frequency": "weekly_and_monthly"
            }
        }