"""
Insight generator service for creating user financial insights using LLM.
Handles LLM updates on weekly and monthly changes.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from google import genai
import logging
import httpx

from config import settings
from schemas import UserInsight, WeeklyComparison, MonthlyComparison
from database import db
from services.comparison_service import ComparisonService
from utils.llm_scheduler import LLMScheduler

logger = logging.getLogger(__name__)


class InsightGenerator:
    """Generate user financial insights with LLM and temporal comparisons"""
    
    def __init__(self):
        self.comparison_service = ComparisonService()
        self.llm_scheduler = LLMScheduler()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.sentiment_service_url = settings.market_sentiment_service_url
        self.gemini_api_key = settings.gemini_api_key
    
    async def generate(
        self,
        user_id: str,
        transactions_data: Optional[Dict[str, Any]] = None,
        current_date: Optional[datetime] = None
    ) -> UserInsight:
        """
        Generate comprehensive user insight with all temporal comparisons.
        
        Returns JSON with:
        - Weekly comparisons (last week & 2 weeks ago)
        - Monthly comparisons (last month & 2 months ago)
        - Category-level comparisons
        - LLM-generated insights and recommendations
        """
        if current_date is None:
            current_date = datetime.utcnow()
        
        if transactions_data is None:
            transactions_data = {"transactions": []}
        
        transactions = transactions_data.get("transactions", [])
        
        # Calculate comparisons
        weekly_comparison = await self.comparison_service.get_weekly_comparison(
            user_id, transactions, current_date
        )
        
        monthly_comparison = await self.comparison_service.get_monthly_comparison(
            user_id, transactions, current_date
        )
        
        category_comparisons = await self.comparison_service.get_category_comparisons(
            user_id, transactions, current_date
        )
        
        # Generate LLM insights
        insights_and_recommendations = await self._generate_llm_insights(
            user_id,
            weekly_comparison,
            monthly_comparison,
            category_comparisons,
            transactions_data
        )
        
        # Build overall spending/income data
        overall_spending = {
            "weekly": {
                "current": weekly_comparison.last_week.current_value,
                "change_percentage": weekly_comparison.last_week.change_percentage
            },
            "monthly": {
                "current": monthly_comparison.last_month.current_value,
                "change_percentage": monthly_comparison.last_month.change_percentage
            }
        }
        
        overall_income = transactions_data.get("overall_income", {})
        
        # Determine if LLM needs update
        llm_last_updated = self.llm_scheduler.get_last_update_time(user_id)
        should_update_llm = self.llm_scheduler.should_update(user_id, current_date)
        
        if should_update_llm:
            llm_last_updated = current_date
            self.llm_scheduler.update_schedule(user_id, current_date)
        
        # Create UserInsight object
        user_insight = UserInsight(
            timestamp=current_date,
            data_retention_days=settings.data_retention_days,
            overall_spending=overall_spending,
            overall_income=overall_income,
            weekly_comparison=weekly_comparison,
            monthly_comparison=monthly_comparison,
            category_insights=category_comparisons,
            insights=insights_and_recommendations.get("insights", []),
            trends=insights_and_recommendations.get("trends", []),
            recommendations=insights_and_recommendations.get("recommendations", []),
            llm_last_updated=llm_last_updated,
            llm_update_frequency=settings.llm_update_frequency
        )
        
        # Save to database (store as dict/json-compatible structure)
        db.save_insight(user_id, user_insight.model_dump())
        
        return user_insight
    
    async def get_latest(self, user_id: str) -> Optional[UserInsight]:
        """Retrieve the latest insight for a user"""
        record = db.get_latest_insight(user_id)
        if not record:
            return None

        # record['insight_data'] is stored JSON/dict
        return UserInsight(**record.get("insight_data", {}))
    
    async def refresh_with_llm(self, user_id: str) -> UserInsight:
        """Manually refresh LLM insights for a user"""
        latest = await self.get_latest(user_id)
        if not latest:
            raise ValueError(f"No insight found for user {user_id}")
        
        # Regenerate with fresh LLM call
        self.llm_scheduler.force_update(user_id)
        return await self.generate(user_id)
    
    async def _generate_llm_insights(
        self,
        user_id: str,
        weekly_comparison: WeeklyComparison,
        monthly_comparison: MonthlyComparison,
        category_comparisons: List,
        transactions_data: Dict[str, Any]
    ) -> Dict[str, List[str]]:
        """
        Use Gemini LLM to generate insights, trends, and recommendations
        based on comparison data.
        """
        try:
            # Prepare prompt for LLM
            prompt = self._build_insight_prompt(
                user_id,
                weekly_comparison,
                monthly_comparison,
                category_comparisons,
                transactions_data
            )
            
            # Call Gemini API
            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config={
                    "temperature": settings.gemini_temperature,
                    "max_output_tokens": settings.gemini_max_tokens,
                    "response_mime_type": "application/json"
                }
            )
            
            # Parse response
            result = response.json()
            
            return {
                "insights": result.get("insights", []),
                "trends": result.get("trends", []),
                "recommendations": result.get("recommendations", [])
            }
        
        except Exception as e:
            logger.error(f"Error generating LLM insights: {str(e)}")
            # Return default insights if LLM fails
            return {
                "insights": ["Unable to generate insights at this time"],
                "trends": ["Data analysis in progress"],
                "recommendations": ["Review your transaction history regularly"]
            }
    
    def _build_insight_prompt(
        self,
        user_id: str,
        weekly_comparison: WeeklyComparison,
        monthly_comparison: MonthlyComparison,
        category_comparisons: List,
        transactions_data: Dict[str, Any]
    ) -> str:
        """Build prompt for LLM with comparison data"""
        return f"""
Analyze the following financial data and provide insights, trends, and recommendations.

WEEKLY COMPARISON:
- Last week: Current {weekly_comparison.last_week.current_value} vs Previous {weekly_comparison.last_week.previous_value} ({weekly_comparison.last_week.change_percentage}% change)
- 2 weeks ago: Current {weekly_comparison.two_weeks_ago.current_value} vs Previous {weekly_comparison.two_weeks_ago.previous_value} ({weekly_comparison.two_weeks_ago.change_percentage}% change)

MONTHLY COMPARISON:
- Last month: Current {monthly_comparison.last_month.current_value} vs Previous {monthly_comparison.last_month.previous_value} ({monthly_comparison.last_month.change_percentage}% change)
- 2 months ago: Current {monthly_comparison.two_months_ago.current_value} vs Previous {monthly_comparison.two_months_ago.previous_value} ({monthly_comparison.two_months_ago.change_percentage}% change)

CATEGORIES: {len(category_comparisons)} categories analyzed
Total transactions: {len(transactions_data.get('transactions', []))}

Generate a JSON response with:
1. insights: List of 3-5 key financial insights based on the data
2. trends: List of 2-3 observed spending trends
3. recommendations: List of 2-3 actionable recommendations

Focus on temporal changes and patterns from the comparisons.
Response must be valid JSON only.
"""

    async def fetch_sentiment_data(self, tokens: List[str], timeframe: str = "7d") -> Dict[str, Any]:
        """Fetch sentiment data from market sentiment service."""
        sentiments = {}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for token in tokens:
                try:
                    response = await client.post(
                        f"{self.sentiment_service_url}/api/v1/sentiment",
                        json={"token": token.upper(), "timeframe": timeframe}
                    )
                    response.raise_for_status()
                    sentiments[token.upper()] = response.json()
                except Exception as e:
                    logger.warning(f"Failed to fetch sentiment for {token}: {e}")
                    sentiments[token.upper()] = {
                        "sentiment": "neutral",
                        "confidence": 0.0,
                        "summary": "Unable to fetch sentiment data"
                    }
        
        return sentiments
    
    async def generate_insight(
        self,
        user_id: str,
        tokens: List[str],
        sentiment_data: Dict[str, Any],
        insight_type: str = "portfolio"
    ) -> tuple[str, float]:
        """Generate personalized insight using Gemini."""
        try:
            from google.generativeai import genai
            genai.configure(api_key=self.gemini_api_key)
            
            # Build insight prompt
            prompt = self._build_insight_prompt(
                user_id, tokens, sentiment_data, insight_type
            )
            
            model = genai.GenerativeModel(settings.gemini_model)
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": settings.gemini_temperature,
                    "max_output_tokens": settings.gemini_max_tokens
                }
            )
            
            insight_text = response.text.strip()
            confidence = self._estimate_confidence(sentiment_data)
            
            return insight_text, confidence
            
        except Exception as e:
            logger.error(f"Failed to generate insight: {e}")
            return "Unable to generate insight at this time.", 0.0
    
    def _build_insight_prompt(
        self,
        user_id: str,
        tokens: List[str],
        sentiment_data: Dict[str, Any],
        insight_type: str
    ) -> str:
        """Build prompt for Gemini."""
        sentiment_summary = self._format_sentiment_data(sentiment_data)
        
        if insight_type == "portfolio":
            return f"""
You are a cryptocurrency portfolio analyst. Generate a personalized insight for a user with holdings in: {', '.join(tokens)}.

Current market sentiment:
{sentiment_summary}

Provide a 150-word insight that:
1. Summarizes the combined sentiment across their holdings
2. Identifies any divergence in sentiment between tokens
3. Suggests risk/opportunity based on sentiment patterns
4. Is personalized and actionable

Tone: Professional, analytical, neutral (no hype or FUD).
Output: Plain text only, no markdown.
"""
        
        elif insight_type == "risk_analysis":
            return f"""
You are a cryptocurrency risk analyst. Analyze portfolio risk for tokens: {', '.join(tokens)}.

Current market sentiment:
{sentiment_summary}

Provide a 150-word risk analysis that:
1. Identifies sentiment-driven risks
2. Highlights consensus vs. divergence
3. Notes potential volatility catalysts
4. Suggests hedging considerations

Tone: Professional, cautious, analytical.
Output: Plain text only, no markdown.
"""
        
        else:  # sentiment_driven
            return f"""
You are a market sentiment analyst. Generate a sentiment-driven insight for: {', '.join(tokens)}.

Sentiment data:
{sentiment_summary}

Provide a 150-word insight that:
1. Synthesizes sentiment across timeframes
2. Identifies emerging narratives
3. Notes sentiment quality and confidence
4. Highlights unresolved tensions

Tone: Professional, nuanced, data-focused.
Output: Plain text only, no markdown.
"""
    
    def _format_sentiment_data(self, sentiment_data: Dict[str, Any]) -> str:
        """Format sentiment data for LLM prompt."""
        formatted = []
        for token, data in sentiment_data.items():
            formatted.append(
                f"{token}: {data.get('sentiment', 'unknown')} "
                f"(confidence: {data.get('confidence', 0):.0%}) - "
                f"{data.get('summary', 'No data')[:100]}..."
            )
        return "\n".join(formatted)
    
    def _estimate_confidence(self, sentiment_data: Dict[str, Any]) -> float:
        """Estimate overall confidence from sentiment data."""
        if not sentiment_data:
            return 0.0
        
        confidences = [
            data.get('confidence', 0.0)
            for data in sentiment_data.values()
        ]
        
        return sum(confidences) / len(confidences) if confidences else 0.0
