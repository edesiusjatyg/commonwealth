"""Production-ready chat service."""

from typing import Optional
import time

from app.agents.gemini_client import GeminiClient
from app.models.requests import ChatRequest
from app.models.responses import ChatResponse, ChatData, ResponseMetadata, ChartConfig, Source
from app.models.enums import ChartType, Timeframe, SourceType
from app.storage.session_store import SessionStore
from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError, ValidationError

logger = get_logger(__name__)


class ChatService:
    """Main chat service handling user requests."""
    
    # Response format template
    RESPONSE_FORMAT = """{
  "data": {
    "coins": "coin ticker symbol in capitalized (e.g., BTC, ETH)",
    "type": "single_chart | comparison | multi_carousel | none",
    "timeframe": "1d | 7d | 30d | 365d",
    "explanation": "maximum of 200 words explaining the analysis"
  },
  "sources": [
    {
      "name": "Source name from web search",
      "link": "https://actual-url-from-search.com"
    }
  ],
  "suggested_next_prompts": [
    "3 word prompt",
    "3 word prompt",
    "3 word prompt"
  ]
}"""
    
    def __init__(self, session_store: SessionStore):
        """Initialize chat service."""
        self.session_store = session_store
        self.gemini_client = GeminiClient()
        logger.info("chat_service_initialized")
    
    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """
        Process user message and generate response.
        
        Args:
            request: Chat request with user message
            
        Returns:
            Complete chat response with data and metadata
        """
        try:
            start_time = time.time()
            
            # Get or create session
            session_id = request.session_id or await self.session_store.create_session()
            
            logger.info("processing_message", session_id=session_id, message_length=len(request.user_message))
            
            # Generate response using Gemini with Google Search
            response_data = self.gemini_client.generate(
                prompt=request.user_message,
                response_format=self.RESPONSE_FORMAT
            )
            
            # Parse and validate response
            chat_data = self._parse_response(response_data)
            
            # Update session history
            await self._update_session(session_id, request.user_message, chat_data)
            
            # Get session TTL
            ttl = await self.session_store.get_session_ttl(session_id)
            
            # Build response
            response = ChatResponse(
                data=chat_data,
                meta=ResponseMetadata(
                    session_id=session_id,
                    ttl_remaining_sec=ttl,
                    generated_at=int(time.time())
                )
            )
            
            elapsed = time.time() - start_time
            logger.info("message_processed", session_id=session_id, elapsed=round(elapsed, 2))
            
            return response
            
        except Exception as e:
            logger.error("message_processing_failed", error=str(e))
            raise AIServiceError(f"Failed to process message: {str(e)}")
    
    def _parse_response(self, response_data: dict) -> ChatData:
        """
        Parse and validate Gemini response data.
        
        Args:
            response_data: Raw response from Gemini
            
        Returns:
            Validated ChatData object
        """
        try:
            # Extract nested data structure
            data = response_data.get("data", {})
            
            # Parse coin symbols
            coins_str = data.get("coins", "")
            coins = [c.strip().upper() for c in coins_str.split(",") if c.strip()]
            if not coins:
                coins = []
            
            # Parse chart type
            chart_type = data.get("type", "none").lower()
            if chart_type not in ["single_chart", "comparison", "multi_carousel", "none"]:
                chart_type = "none"
            
            # Parse timeframe
            timeframe = data.get("timeframe", "1d")
            if timeframe not in ["1d", "7d", "30d", "365d"]:
                timeframe = "1d"
            
            # Get explanation
            explanation = data.get("explanation", "").strip()
            if not explanation:
                raise ValidationError("Missing explanation in response")
            
            # Parse sources from response
            sources_data = response_data.get("sources", [])
            sources = []
            
            if sources_data and isinstance(sources_data, list):
                for src in sources_data:
                    if isinstance(src, dict):
                        name = src.get("name", "").strip()
                        link = src.get("link", "").strip()
                        
                        if name and link:
                            sources.append(Source(
                                type=SourceType.WEB_SEARCH,
                                name=name,
                                url=link
                            ))
            
            # If no valid sources, use default
            if not sources:
                sources = [Source(
                    type=SourceType.SEARCH_ENGINE,
                    name="Google Search",
                    url=None
                )]
            
            # Get suggested prompts
            suggested_prompts = response_data.get("suggested_next_prompts", [])
            if len(suggested_prompts) < 3:
                suggested_prompts = suggested_prompts + ["Tell me more"] * (3 - len(suggested_prompts))
            suggested_prompts = suggested_prompts[:3]
            
            # Create ChatData with proper structure
            chat_data = ChatData(
                chart_config=ChartConfig(
                    coins=coins,
                    type=ChartType(chart_type),
                    timeframe=Timeframe(timeframe) if chart_type != "none" else None
                ),
                explanation=explanation,
                sources=sources,
                suggested_prompts=suggested_prompts
            )
            
            return chat_data
            
        except Exception as e:
            logger.error("response_parsing_failed", error=str(e))
            raise ValidationError(f"Failed to parse response: {str(e)}")
    
    async def _update_session(self, session_id: str, user_message: str, chat_data: ChatData):
        """Update session with conversation turn."""
        try:
            # Get existing session
            session = await self.session_store.get_session(session_id)
            if not session:
                session = await self.session_store.create_session(session_id)
                session = await self.session_store.get_session(session_id)
            
            # Add conversation turn
            from app.models.internal import ConversationTurn, MessageRole
            
            turn = ConversationTurn(
                role=MessageRole.USER,
                content=user_message,
                timestamp=int(time.time())
            )
            
            session.conversation_history.append(turn)
            
            # Save updated session
            await self.session_store.save_session(session)
            
            logger.debug("session_updated", session_id=session_id, history_length=len(session.conversation_history))
            
        except Exception as e:
            logger.warning("session_update_failed", error=str(e))
            # Don't fail the request if session update fails
