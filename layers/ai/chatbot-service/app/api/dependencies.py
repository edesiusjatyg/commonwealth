"""Dependency injection for API routes."""

from typing import AsyncGenerator
from app.storage.session_store import SessionStore
from app.storage.redis_store import RedisSessionStore
from app.storage.memory_store import MemorySessionStore
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_session_store: SessionStore | None = None


async def get_session_store() -> SessionStore:
    """Get session store instance (singleton)."""
    global _session_store
    
    if _session_store is None:
        if settings.use_redis:
            try:
                logger.info("initializing_redis_store")
                _session_store = RedisSessionStore(settings.redis_url)
                # Test connection
                await _session_store.ping()
                logger.info("redis_store_initialized")
            except Exception as e:
                logger.warning("redis_init_failed", error=str(e))
                logger.info("falling_back_to_memory_store")
                _session_store = MemorySessionStore()
        else:
            logger.info("using_memory_store")
            _session_store = MemorySessionStore()
    
    return _session_store
