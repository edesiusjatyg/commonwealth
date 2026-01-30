"""
Comparison service for calculating weekly and monthly financial comparisons.
Handles data aggregation for:
- Weekly: last week & 2 weeks ago
- Monthly: last month & 2 months ago
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging

from ..schemas import (
    WeeklyComparison, 
    MonthlyComparison, 
    PeriodComparison,
    CategoryComparison
)

logger = logging.getLogger(__name__)

@dataclass
class DateRange:
    """Helper class for date range management"""
    start_date: datetime
    end_date: datetime
    
    def __repr__(self) -> str:
        return f"{self.start_date.date()} to {self.end_date.date()}"


class ComparisonService:
    """Service for generating temporal comparisons of financial data"""
    
    @staticmethod
    def compare_sentiments(tokens: List[str], sentiment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compare sentiment across multiple tokens."""
        comparison = {
            "tokens": tokens,
            "bullish": [],
            "neutral": [],
            "bearish": [],
            "consensus": None,
            "divergence_score": 0.0
        }
        
        for token in tokens:
            data = sentiment_data.get(token, {})
            sentiment = data.get('sentiment', 'neutral')
            
            if sentiment == "bullish":
                comparison["bullish"].append(token)
            elif sentiment == "bearish":
                comparison["bearish"].append(token)
            else:
                comparison["neutral"].append(token)
        
        # Calculate divergence
        total = len(tokens)
        if total > 0:
            max_group = max(
                len(comparison["bullish"]),
                len(comparison["neutral"]),
                len(comparison["bearish"])
            )
            comparison["divergence_score"] = 1.0 - (max_group / total)
        
        # Determine consensus
        if len(comparison["bullish"]) > total * 0.66:
            comparison["consensus"] = "bullish"
        elif len(comparison["bearish"]) > total * 0.66:
            comparison["consensus"] = "bearish"
        else:
            comparison["consensus"] = "mixed"
        
        return comparison
    
    @staticmethod
    def identify_outliers(
        tokens: List[str],
        sentiment_data: Dict[str, Any]
    ) -> List[str]:
        """Identify tokens with outlier sentiment vs portfolio."""
        if len(tokens) < 2:
            return []
        
        sentiments = [
            sentiment_data.get(token, {}).get('sentiment', 'neutral')
            for token in tokens
        ]
        
        # Count sentiment types
        sentiment_counts = {}
        for s in sentiments:
            sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
        
        # Find majority sentiment
        majority_sentiment = max(sentiment_counts, key=sentiment_counts.get)
        
        # Find outliers
        outliers = [
            token for token in tokens
            if sentiment_data.get(token, {}).get('sentiment', 'neutral') != majority_sentiment
        ]
        
        return outliers
    
    @staticmethod
    def get_week_range(date: datetime) -> DateRange:
        """Get the start and end of the week for a given date (Mon-Sun)"""
        start = date - timedelta(days=date.weekday())
        end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)
        return DateRange(start, end)
    
    @staticmethod
    def get_month_range(date: datetime) -> DateRange:
        """Get the start and end of the month for a given date"""
        start = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1) - timedelta(seconds=1)
        else:
            end = start.replace(month=start.month + 1) - timedelta(seconds=1)
        return DateRange(start, end)
    
    @staticmethod
    def calculate_period_comparison(
        current_data: Dict[str, float],
        previous_data: Dict[str, float],
        metric: str = "value"
    ) -> PeriodComparison:
        """Calculate comparison metrics between two periods"""
        current_value = current_data.get(metric, 0.0)
        previous_value = previous_data.get(metric, 0.0)
        
        change_amount = current_value - previous_value
        
        if previous_value != 0:
            change_percentage = (change_amount / previous_value) * 100
        else:
            change_percentage = 100.0 if current_value > 0 else 0.0
        
        return PeriodComparison(
            current_value=current_value,
            previous_value=previous_value,
            change_percentage=round(change_percentage, 2),
            change_amount=round(change_amount, 2)
        )
    
    async def get_weekly_comparison(
        self,
        user_id: str,
        transactions: List[Dict[str, Any]],
        current_date: Optional[datetime] = None
    ) -> WeeklyComparison:
        """
        Calculate weekly comparison:
        - Current week vs last week
        - Current week vs 2 weeks ago
        """
        if current_date is None:
            current_date = datetime.utcnow()
        
        # Get week ranges
        current_week = self.get_week_range(current_date)
        last_week_end = current_week.start_date - timedelta(days=1)
        last_week = self.get_week_range(last_week_end)
        two_weeks_end = last_week.start_date - timedelta(days=1)
        two_weeks_ago = self.get_week_range(two_weeks_end)
        
        # Aggregate data for each week
        current_data = self._aggregate_transactions(transactions, current_week)
        last_week_data = self._aggregate_transactions(transactions, last_week)
        two_weeks_data = self._aggregate_transactions(transactions, two_weeks_ago)
        
        # Calculate comparisons
        last_week_comparison = self.calculate_period_comparison(
            current_data, last_week_data
        )
        two_weeks_comparison = self.calculate_period_comparison(
            current_data, two_weeks_data
        )
        
        return WeeklyComparison(
            last_week=last_week_comparison,
            two_weeks_ago=two_weeks_comparison
        )
    
    async def get_monthly_comparison(
        self,
        user_id: str,
        transactions: List[Dict[str, Any]],
        current_date: Optional[datetime] = None
    ) -> MonthlyComparison:
        """
        Calculate monthly comparison:
        - Current month vs last month
        - Current month vs 2 months ago
        """
        if current_date is None:
            current_date = datetime.utcnow()
        
        # Get month ranges
        current_month = self.get_month_range(current_date)
        last_month_end = current_month.start_date - timedelta(days=1)
        last_month = self.get_month_range(last_month_end)
        two_months_end = last_month.start_date - timedelta(days=1)
        two_months_ago = self.get_month_range(two_months_end)
        
        # Aggregate data for each month
        current_data = self._aggregate_transactions(transactions, current_month)
        last_month_data = self._aggregate_transactions(transactions, last_month)
        two_months_data = self._aggregate_transactions(transactions, two_months_ago)
        
        # Calculate comparisons
        last_month_comparison = self.calculate_period_comparison(
            current_data, last_month_data
        )
        two_months_comparison = self.calculate_period_comparison(
            current_data, two_months_data
        )
        
        return MonthlyComparison(
            last_month=last_month_comparison,
            two_months_ago=two_months_comparison
        )
    
    async def get_category_comparisons(
        self,
        user_id: str,
        transactions: List[Dict[str, Any]],
        current_date: Optional[datetime] = None
    ) -> List[CategoryComparison]:
        """Get category-level weekly and monthly comparisons"""
        if current_date is None:
            current_date = datetime.utcnow()
        
        # Group transactions by category
        categories = self._group_by_category(transactions)
        comparisons = []
        
        for category_name, category_transactions in categories.items():
            # Get weekly and monthly comparisons for this category
            weekly = await self.get_weekly_comparison(
                user_id, category_transactions, current_date
            )
            monthly = await self.get_monthly_comparison(
                user_id, category_transactions, current_date
            )
            
            comparisons.append(
                CategoryComparison(
                    category_name=category_name,
                    weekly=weekly,
                    monthly=monthly
                )
            )
        
        return comparisons
    
    @staticmethod
    def _aggregate_transactions(
        transactions: List[Dict[str, Any]],
        date_range: DateRange
    ) -> Dict[str, float]:
        """Aggregate transaction amounts within a date range"""
        total = 0.0
        count = 0
        
        for txn in transactions:
            txn_date = txn.get("date")
            if isinstance(txn_date, str):
                txn_date = datetime.fromisoformat(txn_date)
            
            if date_range.start_date <= txn_date <= date_range.end_date:
                total += txn.get("amount", 0.0)
                count += 1
        
        return {
            "value": total,
            "count": count,
            "average": total / count if count > 0 else 0.0
        }
    
    @staticmethod
    def _group_by_category(
        transactions: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Group transactions by category"""
        categories = {}
        
        for txn in transactions:
            category = txn.get("category", "Uncategorized")
            if category not in categories:
                categories[category] = []
            categories[category].append(txn)
        
        return categories
    
    async def get_spending_trend(
        self,
        user_id: str,
        transactions: List[Dict[str, Any]],
        weeks: int = 4
    ) -> Dict[str, Any]:
        """Analyze spending trend over multiple weeks"""
        current_date = datetime.utcnow()
        trend_data = []
        
        for i in range(weeks):
            week_date = current_date - timedelta(weeks=i)
            week_range = self.get_week_range(week_date)
            week_data = self._aggregate_transactions(transactions, week_range)
            
            trend_data.append({
                "week": week_range,
                "spending": week_data["value"],
                "transaction_count": week_data["count"]
            })
        
        trend_data.reverse()  # Oldest to newest
        
        return {
            "user_id": user_id,
            "period": f"Last {weeks} weeks",
            "trend": trend_data,
            "average_weekly_spending": sum(w["spending"] for w in trend_data) / weeks if trend_data else 0
        }
