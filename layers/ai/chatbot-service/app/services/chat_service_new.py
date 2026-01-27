"""Simplified chat service - main orchestration."""

import time
import uuid
from typing import Optional

from app.models.requests import ChatRequest
from app.models.responses import ChatResponse, ChatData, ChartConfig, Source, ResponseMetadata
from app.models.internal import SessionData, ConversationTurn
from app.models.enums import ChartType, SourceType
from app.storage.session_store import SessionStore
from app.agents.gemini_new import GeminiClient
from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError
from pydantic import ValidationError

logger = get_logger(__name__)


class ChatService:
    """Simplified chat service."""
    
    # Simplified response format prompt
    RESPONSE_FORMAT = '''
{
  "data": {
    "coins": ["BTC"],
    "type": "single_chart",
    "timeframe": "1d",
    "explanation": "Your detailed explanation here (max 500 characters)"
  },
  "suggested_next_prompts": [
    "Follow-up question 1",
    "Follow-up question 2",
    "Follow-up question 3"
  ]
}
'''
    
    def __init__(self, session_store: SessionStore):
        """Initialize chat service."""
        self.session_store = session_store
        self.gemini_client = GeminiClient()
    
    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """Process user message and generate response."""
        # Get or create session
        session_id, session_data = await self._get_or_create_session(request.session_id)
        
        # Build prompt
        prompt = self._build_prompt(request, session_data)
        
        # Generate response
        try:
            raw_response = await self.gemini_client.generate(prompt, use_search=True)
            chat_data = self._parse_response(raw_response)
        except Exception as e:
            logger.error("generation_error", error=str(e), exc_info=True)
            # Fallback response
            chat_data = ChatData(
                chart_config=ChartConfig(coins=[], type=ChartType.NONE, timeframe=None),
                explanation=f"Error: {str(e)[:100]}. Please try again.",
                sources=[Source(type=SourceType.INTERNAL, name="Error Handler", url=None)],
                suggested_prompts=["Try again", "Ask something else", "Get help"]
            )
        
        # Update session
        session_data.conversation_history.append(
            ConversationTurn(role="user", content=request.user_message, timestamp=int(time.time()))
        )
        session_data.conversation_history.append(
            ConversationTurn(role="assistant", content=chat_data.explanation, timestamp=int(time.time()))
        )
        
        # Keep only last 10 turns
        if len(session_data.conversation_history) > 10:
            session_data.conversation_history = session_data.conversation_history[-10:]
        
        session_data.last_activity = int(time.time())
        
        # Save session
        await self.session_store.set(session_id, session_data, settings.session_ttl_seconds)
        
        # Get remaining TTL
        ttl_remaining = await self.session_store.get_ttl(session_id) or settings.session_ttl_seconds
        
        # Build response
        return ChatResponse(
            data=chat_data,
            meta=ResponseMetadata(
                session_id=session_id,
                ttl_remaining_sec=ttl_remaining,
                generated_at=int(time.time())
            )
        )
    
    def _build_prompt(self, request: ChatRequest, session_data: SessionData) -> str:
        """Build prompt for Gemini."""
        parts = []
        
        # System instructions
        parts.append("You are an expert cryptocurrency analyst with access to Google Search.")
        parts.append("Answer the user's question clearly and helpfully.")
        parts.append("")
        
        # Add crypto context if provided
        if request.crypto_context:
            ctx = request.crypto_context
            parts.append(f"Current Market Context: {ctx.symbol}")
            if ctx.price:
                parts.append(f"Price: ${ctx.price:,.2f}")
            if ctx.change_24h is not None:
                parts.append(f"24h Change: {ctx.change_24h:.2f}%")
            parts.append("")
        
        # Add conversation history
        if session_data.conversation_history:
            parts.append("Recent Conversation:")
            for turn in session_data.conversation_history[-4:]:
                role = "User" if turn.role == "user" else "Assistant"
                parts.append(f"{role}: {turn.content[:200]}")
            parts.append("")
        
        # User message
        parts.append(f"User Question: {request.user_message}")
        parts.append("")
        
        # Response format instructions
        parts.append(f"You MUST respond with ONLY valid JSON in this exact format:")
        parts.append(self.RESPONSE_FORMAT)
        parts.append("")
        parts.append("Field Requirements:")
        parts.append("- coins: Array of uppercase coin symbols (e.g. ['BTC', 'ETH']) or empty []")
        parts.append("- type: Must be 'single_chart', 'comparison', 'multi_carousel', or 'none'")
        parts.append("- timeframe: Must be '1d', '7d', '30d', '365d', or null if type is 'none'")
        parts.append("- explanation: Your answer (max 500 characters)")
        parts.append("- suggested_next_prompts: Exactly 3 follow-up questions")
        parts.append("")
        parts.append("NO markdown, NO code blocks - ONLY the JSON object!")
        
        return "\n".join(parts)
    
    def _parse_response(self, raw_response: dict) -> ChatData:
        """Parse Gemini response into ChatData."""
        try:
            # Extract data section
            data = raw_response.get("data", {})
            
            # Parse chart config
            coins = data.get("coins", [])
            if isinstance(coins, str):
                coins = [coins] if coins else []
            
            chart_type = data.get("type", "none")
            timeframe = data.get("timeframe")
            explanation = data.get("explanation", "No explanation provided")
            
            # Parse suggested prompts
            suggested = raw_response.get("suggested_next_prompts", [])
            if len(suggested) != 3:
                suggested = ["Try again", "Ask something else", "Get help"]
            
            # Create chart config
            chart_config = ChartConfig(
                coins=coins,
                type=ChartType(chart_type),
                timeframe=timeframe
            )
            
            # Create default source
            sources = [Source(
                type=SourceType.INTERNAL,
                name="Gemini AI",
                url=None
            )]
            
            return ChatData(
                chart_config=chart_config,
                explanation=explanation,
                sources=sources,
                suggested_prompts=suggested
            )
            
        except (ValueError, ValidationError) as e:
            logger.error("response_parse_error", error=str(e), raw=raw_response)
            raise AIServiceError(f"Failed to parse response: {str(e)}")
    
    async def _get_or_create_session(
        self,
        session_id: Optional[str]
    ) -> tuple[str, SessionData]:
        """Get existing session or create new one."""
        if session_id:
            session_data = await self.session_store.get(session_id)
            if session_data:
                logger.info("session_found", session_id=session_id)
                return session_id, session_data
        
        # Create new session
        new_session_id = str(uuid.uuid4())
        new_session_data = SessionData(
            session_id=new_session_id,
            created_at=int(time.time()),
            last_activity=int(time.time()),
            conversation_history=[]
        )
        
        logger.info("session_created", session_id=new_session_id)
        return new_session_id, new_session_data
