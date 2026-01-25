"""
LLM Update Scheduler for managing weekly and monthly LLM updates.
Triggers automatic LLM refresh on week and month boundaries.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

from utils.date_utils import DateUtils, TimePeriod

logger = logging.getLogger(__name__)


class LLMScheduler:
    """Manage LLM update schedules based on weekly and monthly changes"""
    
    def __init__(self):
        # In production, use Redis or database for persistence
        self.last_updates: Dict[str, Dict[str, datetime]] = {}
    
    def should_update(self, user_id: str, current_date: datetime) -> bool:
        """
        Determine if LLM should be updated for this user.
        Updates on:
        - New week (Monday)
        - New month (1st of month)
        """
        if user_id not in self.last_updates:
            return True
        
        last_update = self.last_updates[user_id].get("last_update")
        if last_update is None:
            return True
        
        # Check if week has changed
        if DateUtils.is_new_week(last_update, current_date):
            return True
        
        # Check if month has changed
        if DateUtils.is_new_month(last_update, current_date):
            return True
        
        return False
    
    def update_schedule(self, user_id: str, update_time: datetime):
        """Record that LLM was updated for this user"""
        if user_id not in self.last_updates:
            self.last_updates[user_id] = {}
        
        self.last_updates[user_id]["last_update"] = update_time
        self.last_updates[user_id]["weekly_update"] = self._get_weekly_update_time(update_time)
        self.last_updates[user_id]["monthly_update"] = self._get_monthly_update_time(update_time)
    
    def force_update(self, user_id: str):
        """Force immediate LLM update"""
        self.update_schedule(user_id, datetime.utcnow())
    
    def get_last_update_time(self, user_id: str) -> datetime:
        """Get the last time LLM was updated for this user"""
        if user_id not in self.last_updates:
            return datetime.utcnow()
        
        return self.last_updates[user_id].get("last_update", datetime.utcnow())
    
    def get_next_update_time(self, user_id: str, current_date: Optional[datetime] = None) -> datetime:
        """Get the next scheduled LLM update time"""
        if current_date is None:
            current_date = datetime.utcnow()
        
        # Next update is at the start of next week or month, whichever comes first
        week_end = DateUtils.get_week_end(current_date)
        month_end = DateUtils.get_month_end(current_date)
        
        next_week_start = week_end + timedelta(days=1)
        next_week_start = next_week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # If we're near month boundary, that's the next update
        if month_end.day - current_date.day <= 7:
            next_month_start = DateUtils.get_month_start(month_end) + timedelta(days=32)
            next_month_start = next_month_start.replace(hour=0, minute=0, second=0, microsecond=0)
            return min(next_week_start, next_month_start)
        
        return next_week_start
    
    def get_update_reason(self, user_id: str, current_date: Optional[datetime] = None) -> str:
        """Get the reason for LLM update"""
        if current_date is None:
            current_date = datetime.utcnow()
        
        if user_id not in self.last_updates:
            return "Initial LLM generation"
        
        last_update = self.last_updates[user_id].get("last_update")
        if last_update is None:
            return "Initial LLM generation"
        
        if DateUtils.is_new_month(last_update, current_date):
            return "Monthly LLM update - New month detected"
        
        if DateUtils.is_new_week(last_update, current_date):
            return "Weekly LLM update - New week detected"
        
        return "Manual LLM refresh"
    
    def get_update_frequency_info(self) -> Dict[str, str]:
        """Get information about update frequency"""
        return {
            "frequency": "weekly_and_monthly",
            "weekly_trigger": "Every Monday at 00:00 UTC",
            "monthly_trigger": "1st of every month at 00:00 UTC",
            "description": "LLM regenerates insights every week and month change to reflect new spending patterns and trends"
        }
    
    def _get_weekly_update_time(self, reference_date: datetime) -> datetime:
        """Get the weekly update time (next Monday)"""
        week_start = DateUtils.get_week_start(reference_date)
        if week_start.date() == reference_date.date():
            # Today is Monday
            return reference_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            # Next Monday
            days_until_monday = (7 - reference_date.weekday()) % 7
            if days_until_monday == 0:
                days_until_monday = 7
            return (reference_date + timedelta(days=days_until_monday)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
    
    def _get_monthly_update_time(self, reference_date: datetime) -> datetime:
        """Get the monthly update time (1st of next month)"""
        month_start = DateUtils.get_month_start(reference_date)
        if month_start.date() == reference_date.date():
            # Today is 1st
            return reference_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            # Next month's 1st
            next_month = month_start + timedelta(days=32)
            return DateUtils.get_month_start(next_month).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
    
    def get_all_user_stats(self) -> Dict[str, Dict]:
        """Get update statistics for all users"""
        stats = {}
        for user_id, updates in self.last_updates.items():
            stats[user_id] = {
                "last_update": updates.get("last_update"),
                "weekly_scheduled": updates.get("weekly_update"),
                "monthly_scheduled": updates.get("monthly_update")
            }
        return stats
    
    @staticmethod
    def should_regenerate_insight(
        last_generated: Optional[datetime],
        cache_ttl_days: int = 7
    ) -> bool:
        """Check if insight should be regenerated."""
        if last_generated is None:
            return True
        
        age = datetime.utcnow() - last_generated
        return age > timedelta(days=cache_ttl_days)
    
    @staticmethod
    def estimate_tokens_needed(
        num_tokens: int,
        num_sources: int,
        insight_type: str
    ) -> int:
        """Estimate LLM tokens needed for request."""
        base_tokens = 200
        per_token = 50
        per_source = 100
        
        type_multiplier = {
            "portfolio": 1.0,
            "risk_analysis": 1.5,
            "sentiment_driven": 1.2
        }.get(insight_type, 1.0)
        
        estimated = (
            base_tokens +
            (num_tokens * per_token) +
            (num_sources * per_source)
        ) * type_multiplier
        
        return int(estimated)
