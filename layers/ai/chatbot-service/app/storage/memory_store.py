"""In-memory session storage implementation for development/testing."""

import asyncio
import time
from typing import Optional, Dict
from app.storage.session_store import SessionStore
from app.models.internal import SessionData
from app.core.logging import get_logger

logger = get_logger(__name__)


class MemorySessionStore(SessionStore):
    """In-memory implementation of session storage with TTL."""
    
    def __init__(self):
        """Initialize in-memory session store."""
        self._data: Dict[str, tuple[SessionData, float]] = {}  # session_id -> (data, expiry_timestamp)
        self._cleanup_task: Optional[asyncio.Task] = None
    
    async def _cleanup_expired(self):
        """Background task to clean up expired sessions."""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                now = time.time()
                expired_keys = [
                    key for key, (_, expiry) in self._data.items()
                    if expiry < now
                ]
                for key in expired_keys:
                    del self._data[key]
                    logger.debug("memory_cleanup", session_id=key)
            except Exception as e:
                logger.error("memory_cleanup_error", error=str(e))
    
    def _start_cleanup_task(self):
        """Start cleanup task if not already running."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cleanup_expired())
    
    async def get(self, session_id: str) -> Optional[SessionData]:
        """Retrieve session data from memory."""
        self._start_cleanup_task()
        
        if session_id not in self._data:
            return None
        
        session_data, expiry = self._data[session_id]
        
        # Check if expired
        if expiry < time.time():
            del self._data[session_id]
            return None
        
        return session_data
    
    async def set(self, session_id: str, session_data: SessionData, ttl: int) -> None:
        """Store session data in memory with TTL."""
        self._start_cleanup_task()
        
        expiry = time.time() + ttl
        self._data[session_id] = (session_data, expiry)
        logger.debug("memory_set", session_id=session_id, ttl=ttl)
    
    async def delete(self, session_id: str) -> bool:
        """Delete session from memory."""
        if session_id in self._data:
            del self._data[session_id]
            return True
        return False
    
    async def update_ttl(self, session_id: str, ttl: int) -> bool:
        """Update session TTL in memory."""
        if session_id not in self._data:
            return False
        
        session_data, _ = self._data[session_id]
        expiry = time.time() + ttl
        self._data[session_id] = (session_data, expiry)
        return True
    
    async def get_ttl(self, session_id: str) -> Optional[int]:
        """Get remaining TTL from memory."""
        if session_id not in self._data:
            return None
        
        _, expiry = self._data[session_id]
        remaining = int(expiry - time.time())
        
        if remaining < 0:
            del self._data[session_id]
            return None
        
        return remaining
    
    async def ping(self) -> bool:
        """Memory store is always available."""
        return True
    
    async def close(self) -> None:
        """Cancel cleanup task."""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
