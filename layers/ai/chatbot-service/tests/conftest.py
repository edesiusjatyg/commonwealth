"""Pytest configuration and fixtures."""

import pytest
import pytest_asyncio
from typing import AsyncGenerator

from app.storage.memory_store import MemorySessionStore


@pytest_asyncio.fixture
async def session_store() -> AsyncGenerator[MemorySessionStore, None]:
    """Provide in-memory session store for tests."""
    store = MemorySessionStore()
    yield store
    await store.close()


@pytest.fixture
def sample_user_message() -> str:
    """Sample user message for tests."""
    return "How is Bitcoin performing this week?"


@pytest.fixture
def sample_session_id() -> str:
    """Sample session ID for tests."""
    return "test-session-123"
