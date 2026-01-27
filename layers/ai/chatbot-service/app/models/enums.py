"""Enumeration types for the chatbot service."""

from enum import Enum


class ChartType(str, Enum):
    """Chart visualization types."""
    
    SINGLE_CHART = "single_chart"
    COMPARISON = "comparison"
    MULTI_CAROUSEL = "multi_carousel"
    NONE = "none"


class Timeframe(str, Enum):
    """Time periods for chart data."""
    
    ONE_DAY = "1d"
    SEVEN_DAYS = "7d"
    THIRTY_DAYS = "30d"
    THREE_SIXTY_FIVE_DAYS = "365d"


class SourceType(str, Enum):
    """Types of information sources."""
    
    NEWS = "news"
    WEB_SEARCH = "web_search"
    SEARCH_ENGINE = "search_engine"
    INTERNAL = "internal"
    NONE = "none"


class Freshness(str, Enum):
    """Freshness parameters for news search."""
    
    ONE_DAY = "oneDay"
    ONE_WEEK = "oneWeek"
    ONE_MONTH = "oneMonth"
    ONE_YEAR = "oneYear"
    NO_LIMIT = "noLimit"
