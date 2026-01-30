"""Tests for session storage."""

import pytest
import time
from app.models.internal import SessionData, ConversationTurn


@pytest.mark.asyncio
class TestMemorySessionStore:
    """Tests for MemorySessionStore."""
    
    async def test_set_and_get_session(self, session_store, sample_session_id):
        """Test setting and getting session data."""
        session_data = SessionData(
            session_id=sample_session_id,
            created_at=int(time.time()),
            last_activity=int(time.time()),
            conversation_history=[]
        )
        
        await session_store.set(sample_session_id, session_data, ttl=3600)
        
        retrieved = await session_store.get(sample_session_id)
        assert retrieved is not None
        assert retrieved.session_id == sample_session_id
    
    async def test_get_nonexistent_session(self, session_store):
        """Test getting non-existent session."""
        result = await session_store.get("nonexistent")
        assert result is None
    
    async def test_delete_session(self, session_store, sample_session_id):
        """Test deleting session."""
        session_data = SessionData(
            session_id=sample_session_id,
            created_at=int(time.time()),
            last_activity=int(time.time()),
            conversation_history=[]
        )
        
        await session_store.set(sample_session_id, session_data, ttl=3600)
        deleted = await session_store.delete(sample_session_id)
        
        assert deleted is True
        
        retrieved = await session_store.get(sample_session_id)
        assert retrieved is None
    
    async def test_update_ttl(self, session_store, sample_session_id):
        """Test updating session TTL."""
        session_data = SessionData(
            session_id=sample_session_id,
            created_at=int(time.time()),
            last_activity=int(time.time()),
            conversation_history=[]
        )
        
        await session_store.set(sample_session_id, session_data, ttl=100)
        
        updated = await session_store.update_ttl(sample_session_id, 200)
        assert updated is True
        
        ttl = await session_store.get_ttl(sample_session_id)
        assert ttl is not None
        assert ttl > 100
    
    async def test_get_ttl(self, session_store, sample_session_id):
        """Test getting session TTL."""
        session_data = SessionData(
            session_id=sample_session_id,
            created_at=int(time.time()),
            last_activity=int(time.time()),
            conversation_history=[]
        )
        
        await session_store.set(sample_session_id, session_data, ttl=3600)
        
        ttl = await session_store.get_ttl(sample_session_id)
        assert ttl is not None
        assert ttl > 0
        assert ttl <= 3600
    
    async def test_ping(self, session_store):
        """Test ping method."""
        result = await session_store.ping()
        assert result is True
    
    async def test_session_with_conversation_history(self, session_store, sample_session_id):
        """Test session with conversation history."""
        history = [
            ConversationTurn(
                role="user",
                content="Hello",
                timestamp=int(time.time())
            ),
            ConversationTurn(
                role="assistant",
                content="Hi there!",
                timestamp=int(time.time())
            )
        ]
        
        session_data = SessionData(
            session_id=sample_session_id,
            created_at=int(time.time()),
            last_activity=int(time.time()),
            conversation_history=history
        )
        
        await session_store.set(sample_session_id, session_data, ttl=3600)
        
        retrieved = await session_store.get(sample_session_id)
        assert retrieved is not None
        assert len(retrieved.conversation_history) == 2
        assert retrieved.conversation_history[0].role == "user"
        assert retrieved.conversation_history[1].role == "assistant"
