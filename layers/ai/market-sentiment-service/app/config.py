"""
Configuration module for loading environment variables and application settings.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    langsearch_api_key: str = os.getenv("LANGCHAIN_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Database settings
    postgres_host: str = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))
    postgres_db: str = os.getenv("POSTGRES_DB", "market_sentiment")
    postgres_user: str = os.getenv("POSTGRES_USER", "sentiment_user")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "sentiment_pass")
    
    # Application settings
    app_name: str = "Market Sentiment Service"
    app_version: str = "0.6.0"
    debug: bool = False
    
    # API limits
    max_langsearch_results: int = 5  # LangSearch max results per query
    
    # Gemini settings
    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = 0.3
    gemini_max_tokens: int = 4096  # Increased for 300-500 word responses
    
    # Cache settings
    article_cache_ttl_days: int = 30
    max_queries_per_token_timeframe: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env
        extra = "ignore"  # Ignore extra fields from .env


# Global settings instance
settings = Settings()
