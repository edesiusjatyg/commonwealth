"""
Utilities for date calculations and period management.
"""
from datetime import datetime, timedelta
from typing import Tuple, List
from enum import Enum


class TimePeriod(Enum):
    """Enumeration of time periods"""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class DateUtils:
    """Utility functions for date calculations"""
    
    @staticmethod
    def get_week_start(date: datetime) -> datetime:
        """Get Monday of the week for given date"""
        days_since_monday = date.weekday()
        return (date - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    
    @staticmethod
    def get_week_end(date: datetime) -> datetime:
        """Get Sunday of the week for given date"""
        week_start = DateUtils.get_week_start(date)
        return (week_start + timedelta(days=6)).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
    
    @staticmethod
    def get_month_start(date: datetime) -> datetime:
        """Get first day of the month"""
        return date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    @staticmethod
    def get_month_end(date: datetime) -> datetime:
        """Get last day of the month"""
        next_month = DateUtils.get_month_start(date) + timedelta(days=32)
        last_day = DateUtils.get_month_start(next_month) - timedelta(seconds=1)
        return last_day
    
    @staticmethod
    def get_last_week(date: datetime) -> Tuple[datetime, datetime]:
        """Get start and end dates of the previous week"""
        week_start = DateUtils.get_week_start(date)
        last_week_end = week_start - timedelta(seconds=1)
        last_week_start = DateUtils.get_week_start(last_week_end)
        return last_week_start, DateUtils.get_week_end(last_week_end)
    
    @staticmethod
    def get_two_weeks_ago(date: datetime) -> Tuple[datetime, datetime]:
        """Get start and end dates of two weeks ago"""
        last_week_start, last_week_end = DateUtils.get_last_week(date)
        two_weeks_ago_end = last_week_start - timedelta(seconds=1)
        two_weeks_ago_start = DateUtils.get_week_start(two_weeks_ago_end)
        return two_weeks_ago_start, DateUtils.get_week_end(two_weeks_ago_end)
    
    @staticmethod
    def get_last_month(date: datetime) -> Tuple[datetime, datetime]:
        """Get start and end dates of the previous month"""
        month_start = DateUtils.get_month_start(date)
        last_month_end = month_start - timedelta(seconds=1)
        last_month_start = DateUtils.get_month_start(last_month_end)
        return last_month_start, DateUtils.get_month_end(last_month_end)
    
    @staticmethod
    def get_two_months_ago(date: datetime) -> Tuple[datetime, datetime]:
        """Get start and end dates of two months ago"""
        last_month_start, last_month_end = DateUtils.get_last_month(date)
        two_months_ago_end = last_month_start - timedelta(seconds=1)
        two_months_ago_start = DateUtils.get_month_start(two_months_ago_end)
        return two_months_ago_start, DateUtils.get_month_end(two_months_ago_end)
    
    @staticmethod
    def format_date_range(start: datetime, end: datetime) -> str:
        """Format date range as readable string"""
        if start.date() == end.date():
            return start.strftime("%Y-%m-%d")
        return f"{start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}"
    
    @staticmethod
    def is_new_week(date1: datetime, date2: datetime) -> bool:
        """Check if two dates are in different weeks"""
        return DateUtils.get_week_start(date1) != DateUtils.get_week_start(date2)
    
    @staticmethod
    def is_new_month(date1: datetime, date2: datetime) -> bool:
        """Check if two dates are in different months"""
        return (date1.year, date1.month) != (date2.year, date2.month)
    
    @staticmethod
    def days_until_period_end(date: datetime, period: TimePeriod) -> int:
        """Calculate days remaining until end of current period"""
        if period == TimePeriod.WEEKLY:
            week_end = DateUtils.get_week_end(date)
            return (week_end - date).days + 1
        elif period == TimePeriod.MONTHLY:
            month_end = DateUtils.get_month_end(date)
            return (month_end - date).days + 1
        return 0


def get_timeframe_for_analysis() -> str:
    """Determine appropriate timeframe for analysis."""
    # Use 7-day window for user insights
    return "7d"


def format_datetime(dt: datetime) -> str:
    """Format datetime for display."""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def get_date_range(days: int = 7) -> tuple[datetime, datetime]:
    """Get date range for analysis."""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date
