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
    duckduckgo_api_key: str = os.getenv("DUCKDUCKGO_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Application settings
    app_name: str = "Market Sentiment Service"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # API limits
    max_duckduckgo_results: int = 50
    
    # Gemini settings
    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = 0.3
    gemini_max_tokens: int = 4096  # Increased for 300-500 word responses
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
