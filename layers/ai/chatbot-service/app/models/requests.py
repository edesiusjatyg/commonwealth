"""Request models for the chatbot API."""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class Metadata(BaseModel):
    """Metadata about the request."""
    
    model_config = ConfigDict(extra="forbid")
    
    ui_source: str = Field(..., min_length=1, max_length=100)
    client_ts: int = Field(..., ge=0)
    
    @field_validator("ui_source")
    @classmethod
    def validate_ui_source(cls, v: str) -> str:
        """Validate and normalize UI source."""
        return v.strip()


class CryptoContext(BaseModel):
    """Optional cryptocurrency context from another service."""
    
    model_config = ConfigDict(extra="forbid")
    
    symbol: str = Field(..., min_length=1, max_length=20)
    price: Optional[float] = Field(None, ge=0)
    change_24h: Optional[float] = None
    volume_24h: Optional[float] = Field(None, ge=0)
    market_cap: Optional[float] = Field(None, ge=0)
    
    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        """Validate and normalize cryptocurrency symbol."""
        normalized = v.strip().upper()
        if not normalized.isalpha():
            raise ValueError("Symbol must contain only letters")
        return normalized


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    
    model_config = ConfigDict(extra="forbid")
    
    session_id: Optional[str] = Field(None, min_length=1, max_length=100)
    user_message: str = Field(..., min_length=1, max_length=2000)
    metadata: Metadata
    crypto_context: Optional[CryptoContext] = None
    external_context: Optional[str] = Field(None, max_length=5000)
    
    @field_validator("user_message")
    @classmethod
    def validate_user_message(cls, v: str) -> str:
        """Validate and normalize user message."""
        normalized = v.strip()
        if not normalized:
            raise ValueError("User message cannot be empty after normalization")
        # Reject null bytes and control characters
        if '\x00' in normalized or any(ord(c) < 32 and c not in '\n\r\t' for c in normalized):
            raise ValueError("User message contains invalid characters")
        return normalized
    
    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: Optional[str]) -> Optional[str]:
        """Validate session ID if provided."""
        if v is not None:
            normalized = v.strip()
            if not normalized:
                return None
            return normalized
        return v
    
    @field_validator("external_context")
    @classmethod
    def validate_external_context(cls, v: Optional[str]) -> Optional[str]:
        """Validate external context if provided."""
        if v is not None:
            normalized = v.strip()
            if not normalized:
                return None
            return normalized
        return v
