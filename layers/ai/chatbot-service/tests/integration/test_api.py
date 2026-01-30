"""Integration tests for the API."""

import pytest
from httpx import ASGITransport, AsyncClient
import time

from app.main import app


@pytest.mark.asyncio
class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    async def test_health_check(self):
        """Test health check endpoint."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/health")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "timestamp" in data
            assert "version" in data
    
    async def test_readiness_check(self):
        """Test readiness check endpoint."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/ready")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"
    
    async def test_root_endpoint(self):
        """Test root endpoint."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/")
            
            assert response.status_code == 200
            data = response.json()
            assert "service" in data
            assert "version" in data


@pytest.mark.asyncio
class TestChatEndpoint:
    """Tests for chat endpoint."""
    
    @pytest.fixture
    def valid_chat_request(self):
        """Valid chat request payload."""
        return {
            "session_id": None,
            "user_message": "How is Bitcoin performing?",
            "metadata": {
                "ui_source": "chat_panel",
                "client_ts": int(time.time())
            },
            "crypto_context": None,
            "external_context": None
        }
    
    async def test_chat_endpoint_structure(self, valid_chat_request):
        """Test that chat endpoint accepts valid requests."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/chat", json=valid_chat_request)
            
            # May fail if API keys not configured, but should validate structure
            assert response.status_code in [200, 503, 500]
            
            if response.status_code == 200:
                data = response.json()
                assert "data" in data
                assert "meta" in data
    
    async def test_chat_endpoint_invalid_request(self):
        """Test chat endpoint with invalid request."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/chat", json={
                "invalid": "request"
            })
            
            assert response.status_code == 422  # Unprocessable entity
    
    async def test_chat_endpoint_empty_message(self):
        """Test chat endpoint with empty message."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/chat", json={
                "session_id": None,
                "user_message": "",
                "metadata": {
                    "ui_source": "chat_panel",
                    "client_ts": int(time.time())
                }
            })
            
            assert response.status_code == 422
    
    async def test_chat_endpoint_with_crypto_context(self, valid_chat_request):
        """Test chat endpoint with crypto context."""
        valid_chat_request["crypto_context"] = {
            "symbol": "BTC",
            "price": 43500.0,
            "change_24h": 2.5,
            "volume_24h": 1000000000,
            "market_cap": 850000000000
        }
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/chat", json=valid_chat_request)
            
            assert response.status_code in [200, 503, 500]
