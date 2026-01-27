"""Redis-based session storage implementation."""

import json
from typing import Optional
import redis.asyncio as aioredis
from app.storage.session_store import SessionStore
from app.models.internal import SessionData
from app.core.logging import get_logger

logger = get_logger(__name__)


class RedisSessionStore(SessionStore):
    """Redis implementation of session storage."""
    
    def __init__(self, redis_url: str):
        """
        Initialize Redis session store.
        
        Args:
            redis_url: Redis connection URL
        """
        self.redis_url = redis_url
        self.redis: Optional[aioredis.Redis] = None
    
    async def _get_client(self) -> aioredis.Redis:
        """Get or create Redis client."""
        if self.redis is None:
            self.redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self.redis
    
    def _make_key(self, session_id: str) -> str:
        """Create Redis key for session."""
        return f"session:{session_id}"
    
    async def get(self, session_id: str) -> Optional[SessionData]:
        """Retrieve session data from Redis."""
        try:
            client = await self._get_client()
            data = await client.get(self._make_key(session_id))
            
            if data is None:
                return None
            
            session_dict = json.loads(data)
            return SessionData(**session_dict)
            
        except Exception as e:
            logger.error("redis_get_error", session_id=session_id, error=str(e))
            return None
    
    async def set(self, session_id: str, session_data: SessionData, ttl: int) -> None:
        """Store session data in Redis with TTL."""
        try:
            client = await self._get_client()
            data = session_data.model_dump_json()
            await client.setex(
                self._make_key(session_id),
                ttl,
                data
            )
            logger.debug("redis_set", session_id=session_id, ttl=ttl)
            
        except Exception as e:
            logger.error("redis_set_error", session_id=session_id, error=str(e))
            raise
    
    async def delete(self, session_id: str) -> bool:
        """Delete session from Redis."""
        try:
            client = await self._get_client()
            result = await client.delete(self._make_key(session_id))
            return result > 0
            
        except Exception as e:
            logger.error("redis_delete_error", session_id=session_id, error=str(e))
            return False
    
    async def update_ttl(self, session_id: str, ttl: int) -> bool:
        """Update session TTL in Redis."""
        try:
            client = await self._get_client()
            result = await client.expire(self._make_key(session_id), ttl)
            return result
            
        except Exception as e:
            logger.error("redis_update_ttl_error", session_id=session_id, error=str(e))
            return False
    
    async def get_ttl(self, session_id: str) -> Optional[int]:
        """Get remaining TTL from Redis."""
        try:
            client = await self._get_client()
            ttl = await client.ttl(self._make_key(session_id))
            
            # Redis returns -2 if key doesn't exist, -1 if no expiry
            if ttl < 0:
                return None
            
            return ttl
            
        except Exception as e:
            logger.error("redis_get_ttl_error", session_id=session_id, error=str(e))
            return None
    
    async def ping(self) -> bool:
        """Check Redis connection."""
        try:
            client = await self._get_client()
            await client.ping()
            return True
        except Exception as e:
            logger.error("redis_ping_error", error=str(e))
            return False
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()
            self.redis = None
