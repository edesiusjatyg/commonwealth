"""API routes for chatbot service."""

from fastapi import APIRouter, Depends
import time
import uuid

from app.models.requests import ChatRequest
from app.models.responses import ChatResponse
from app.storage.session_store import SessionStore
from app.api.dependencies import get_session_store
from app.services.chat_service import ChatService
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    session_store: SessionStore = Depends(get_session_store)
) -> ChatResponse:
    """Process chat message and return AI response."""
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info(
        "chat_request",
        request_id=request_id,
        has_session=bool(request.session_id),
        message_length=len(request.user_message)
    )
    
    try:
        # Initialize chat service
        chat_service = ChatService(session_store)
        
        # Process request
        response = await chat_service.process_message(request)
        
        elapsed = time.time() - start_time
        logger.info(
            "chat_success",
            request_id=request_id,
            session_id=response.meta.session_id,
            elapsed=round(elapsed, 2)
        )
        
        return response
        
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(
            "chat_failed",
            request_id=request_id,
            error=str(e),
            elapsed=round(elapsed, 2),
            exc_info=True
        )
        raise
