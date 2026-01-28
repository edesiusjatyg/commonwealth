"""Enumeration types for the chatbot service."""

from enum import Enum


class Timeframe(str, Enum):
    """Time periods for TradingView charts."""
    
    ONE_DAY = "1d"
    ONE_MONTH = "1m"
    THREE_MONTHS = "3m"
    ONE_YEAR = "1y"
    ALL_TIME = "all"


class ChartType(str, Enum):
    """Types of charts for visualization."""
    
    LINE = "line"
    CANDLESTICK = "candlestick"
    BAR = "bar"
    AREA = "area"


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
