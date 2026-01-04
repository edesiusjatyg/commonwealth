"""
Configuration module for loading environment variables and application settings.
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App settings
    app_name: str = "user-insights-service"
    app_version: str = "0.1.0"
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # API Keys
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Database settings
    postgres_host: str = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))
    postgres_db: str = os.getenv("POSTGRES_DB", "user_insights")
    postgres_user: str = os.getenv("POSTGRES_USER", "insights_user")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "insights_pass")
    
    # Service URLs
    market_sentiment_service_url: str = os.getenv(
        "MARKET_SENTIMENT_SERVICE_URL", 
        "http://localhost:8000"
    )
    
    # LLM settings
    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = 0.7
    gemini_max_tokens: int = 2048
    
    # Cache settings
    insight_cache_ttl_days: int = 7
    
    @property
    def database_url(self) -> str:
        """Construct database URL."""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:"
            f"{self.postgres_password}@{self.postgres_host}:"
            f"{self.postgres_port}/{self.postgres_db}"
        )
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
