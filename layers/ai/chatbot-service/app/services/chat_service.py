"""Production-ready chat service."""

from typing import Optional
import time

from app.agents.gemini_client import GeminiClient
from app.models.requests import ChatRequest
from app.models.responses import ChatResponse, ChatData, ResponseMetadata
from app.models.enums import Timeframe
from app.storage.session_store import SessionStore
from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError, ValidationError

logger = get_logger(__name__)


class ChatService:
    """Main chat service handling user requests."""
    
    def __init__(self, session_store: SessionStore):
        """Initialize chat service."""
        self.session_store = session_store
        self.gemini_client = GeminiClient()
        self.system_prompt = self._load_system_prompt()
        logger.info("chat_service_initialized")
    
    def _load_system_prompt(self) -> str:
        """Load system prompt from file."""
        try:
            import os
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "models", "SYSTEM_PROMPT.md")
            with open(prompt_path, "r") as f:
                return f.read()
        except Exception as e:
            logger.warning("failed_to_load_system_prompt", error=str(e))
            return "You are a cryptocurrency market analysis assistant. Provide accurate and helpful information."
    
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
            
            # Get or create session ID
            import uuid
            session_id = request.session_id or str(uuid.uuid4())
            
            logger.info("processing_message", session_id=session_id, message_length=len(request.user_message))
            
            # Generate response using Gemini with enforced JSON output
            response_data = self.gemini_client.generate(
                prompt=request.user_message,
                system_prompt=self.system_prompt
            )
            
            # Parse and validate response
            chat_data = self._parse_response(response_data)
            
            # Update session history
            await self._update_session(session_id, request.user_message, chat_data)
            
            # Get session TTL
            ttl = await self.session_store.get_ttl(session_id)
            if ttl is None:
                ttl = 3600  # Default to 1 hour
            
            # Build response
            response = ChatResponse(
                data=chat_data,
                suggested_next_prompts=response_data.get("suggested_next_prompts", ["Tell me more", "What else?", "Continue"]),
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
            # Extract data structure
            data = response_data.get("data", {})
            
            # Parse coin symbols
            coins = data.get("coins", [])
            if isinstance(coins, str):
                # Handle case where coins is a comma-separated string
                coins = [c.strip().upper() for c in coins.split(",") if c.strip()]
            elif isinstance(coins, list):
                # Ensure all coins are uppercase strings
                coins = [str(c).strip().upper() for c in coins if c]
            else:
                coins = []
            
            # Parse timeframe
            timeframe = data.get("timeframe", "1m")
            if timeframe not in ["1d", "1m", "3m", "1y", "all"]:
                timeframe = "1m"
            
            # Get explanation
            explanation = data.get("explanation", "").strip()
            if not explanation:
                raise ValidationError("Missing explanation in response")
            
            # Create ChatData with new structure
            chat_data = ChatData(
                coins=coins,
                timeframe=Timeframe(timeframe),
                explanation=explanation
            )
            
            return chat_data
            
        except Exception as e:
            logger.error("response_parsing_failed", error=str(e))
            raise ValidationError(f"Failed to parse response: {str(e)}")
    
    async def _update_session(self, session_id: str, user_message: str, chat_data: ChatData):
        """Update session with conversation turn."""
        try:
            # Get existing session or create new one
            session = await self.session_store.get(session_id)
            if not session:
                from app.models.internal import SessionData
                session = SessionData(
                    session_id=session_id,
                    conversation_history=[],
                    created_at=int(time.time()),
                    last_activity=int(time.time())
                )
            
            # Add conversation turn
            from app.models.internal import ConversationTurn
            
            turn = ConversationTurn(
                role="user",
                content=user_message,
                timestamp=int(time.time())
            )
            
            session.conversation_history.append(turn)
            session.last_activity = int(time.time())
            
            # Save updated session with TTL (1 hour)
            await self.session_store.set(session_id, session, ttl=3600)
            
            logger.debug("session_updated", session_id=session_id, history_length=len(session.conversation_history))
            
        except Exception as e:
            logger.warning("session_update_failed", error=str(e))
            # Don't fail the request if session update fails
