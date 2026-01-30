"""Internal data models for the chatbot service."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.enums import Freshness


class ConversationTurn(BaseModel):
    """A single turn in the conversation."""
    
    role: str  # "user" or "assistant"
    content: str
    timestamp: int


class SessionData(BaseModel):
    """Session data stored in Redis/memory."""
    
    session_id: str
    conversation_history: List[ConversationTurn] = Field(default_factory=list)
    created_at: int
    last_activity: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ToolCall(BaseModel):
    """Representation of a tool call."""
    
    name: str
    arguments: Dict[str, Any]


class ToolResult(BaseModel):
    """Result from tool execution."""
    
    tool_name: str
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class NewsSearchParams(BaseModel):
    """Parameters for news search tool."""
    
    query: str = Field(..., min_length=1, max_length=200)
    freshness: Freshness = Freshness.ONE_WEEK
    max_results: int = Field(default=3, ge=1, le=3)


class NewsArticle(BaseModel):
    """A single news article."""
    
    title: str
    url: str
    source_name: str
    published_at: Optional[str] = None
    summary: Optional[str] = None
