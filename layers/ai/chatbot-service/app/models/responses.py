"""Response models for the chatbot API."""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.enums import ChartType, Timeframe, SourceType


class ChartConfig(BaseModel):
    """Configuration for chart visualization."""
    
    model_config = ConfigDict(extra="forbid")
    
    coins: List[str] = Field(..., min_length=0, max_length=5)
    type: ChartType
    timeframe: Optional[Timeframe] = None
    
    @field_validator("coins")
    @classmethod
    def validate_coins(cls, v: List[str]) -> List[str]:
        """Validate coin symbols."""
        validated = []
        for coin in v:
            normalized = coin.strip().upper()
            if not normalized.isalpha():
                raise ValueError(f"Invalid coin symbol: {coin}")
            validated.append(normalized)
        return validated


class Source(BaseModel):
    """Information source attribution."""
    
    model_config = ConfigDict(extra="forbid")
    
    type: SourceType
    name: str = Field(..., min_length=1, max_length=200)
    url: Optional[str] = Field(None, max_length=500)
    
    @field_validator("url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL format."""
        if v is None:
            return None
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class ChatData(BaseModel):
    """Main response data."""
    
    model_config = ConfigDict(extra="forbid")
    
    coins: List[str] = Field(default_factory=list, max_length=5)
    timeframe: Timeframe
    explanation: str = Field(..., min_length=1, max_length=2000)
    
    @field_validator("coins")
    @classmethod
    def validate_coins(cls, v: List[str]) -> List[str]:
        """Validate coin symbols."""
        validated = []
        for coin in v:
            normalized = coin.strip().upper()
            if not normalized.isalpha():
                raise ValueError(f"Invalid coin symbol: {coin}")
            validated.append(normalized)
        return validated


class ResponseMetadata(BaseModel):
    """Metadata about the response."""
    
    model_config = ConfigDict(extra="forbid")
    
    session_id: str = Field(..., min_length=1, max_length=100)
    ttl_remaining_sec: int = Field(..., ge=0)
    generated_at: int = Field(..., ge=0)


class ChatResponse(BaseModel):
    """Complete API response."""
    
    model_config = ConfigDict(extra="forbid")
    
    data: ChatData
    suggested_next_prompts: List[str] = Field(..., min_length=3, max_length=3)
    meta: ResponseMetadata
    
    @field_validator("suggested_next_prompts")
    @classmethod
    def validate_prompts(cls, v: List[str]) -> List[str]:
        """Validate suggested prompts."""
        if len(v) != 3:
            raise ValueError("Must provide exactly 3 suggested prompts")
        validated = []
        for prompt in v:
            normalized = prompt.strip()
            if not normalized:
                raise ValueError("Suggested prompt cannot be empty")
            if len(normalized) > 100:
                raise ValueError("Suggested prompt too long")
            validated.append(normalized)
        return validated


class ErrorDetail(BaseModel):
    """Error detail information."""
    
    model_config = ConfigDict(extra="forbid")
    
    type: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response."""
    
    model_config = ConfigDict(extra="forbid")
    
    error: ErrorDetail
