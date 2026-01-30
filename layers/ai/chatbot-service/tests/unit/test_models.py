"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.models.requests import ChatRequest, Metadata, CryptoContext
from app.models.responses import ChatResponse, ChatData, ChartConfig, Source, ResponseMetadata
from app.models.enums import ChartType, Timeframe, SourceType


class TestRequestModels:
    """Tests for request models."""
    
    def test_valid_chat_request(self):
        """Test valid chat request."""
        request = ChatRequest(
            session_id=None,
            user_message="How is Bitcoin?",
            metadata=Metadata(ui_source="chat_panel", client_ts=1736400000),
            crypto_context=None,
            external_context=None
        )
        
        assert request.user_message == "How is Bitcoin?"
        assert request.session_id is None
    
    def test_chat_request_with_crypto_context(self):
        """Test chat request with crypto context."""
        request = ChatRequest(
            session_id="test-123",
            user_message="Analyze BTC",
            metadata=Metadata(ui_source="sentiment_card", client_ts=1736400000),
            crypto_context=CryptoContext(
                symbol="BTC",
                price=43500.0,
                change_24h=2.5
            )
        )
        
        assert request.crypto_context.symbol == "BTC"
        assert request.crypto_context.price == 43500.0
    
    def test_empty_user_message_fails(self):
        """Test that empty user message fails validation."""
        with pytest.raises(PydanticValidationError):
            ChatRequest(
                session_id=None,
                user_message="",
                metadata=Metadata(ui_source="chat_panel", client_ts=1736400000)
            )
    
    def test_user_message_strips_whitespace(self):
        """Test that user message strips whitespace."""
        request = ChatRequest(
            session_id=None,
            user_message="  Hello  ",
            metadata=Metadata(ui_source="chat_panel", client_ts=1736400000)
        )
        
        assert request.user_message == "Hello"
    
    def test_crypto_context_validates_symbol(self):
        """Test crypto context symbol validation."""
        context = CryptoContext(symbol="BTC", price=43500.0)
        assert context.symbol == "BTC"
        
        context = CryptoContext(symbol="btc", price=43500.0)
        assert context.symbol == "BTC"  # Uppercased
    
    def test_extra_fields_rejected(self):
        """Test that extra fields are rejected."""
        with pytest.raises(PydanticValidationError):
            ChatRequest(
                session_id=None,
                user_message="Hello",
                metadata=Metadata(ui_source="chat_panel", client_ts=1736400000),
                extra_field="not_allowed"
            )


class TestResponseModels:
    """Tests for response models."""
    
    def test_valid_chat_response(self):
        """Test valid chat response."""
        response = ChatResponse(
            data=ChatData(
                chart_config=ChartConfig(
                    coins=["BTC"],
                    type=ChartType.SINGLE_CHART,
                    timeframe=Timeframe.SEVEN_DAYS
                ),
                explanation="Bitcoin is consolidating.",
                sources=[Source(
                    type=SourceType.INTERNAL,
                    name="Market Analysis",
                    url=None
                )],
                suggested_prompts=[
                    "Show more details",
                    "Compare with ETH",
                    "Latest news"
                ]
            ),
            meta=ResponseMetadata(
                session_id="test-123",
                ttl_remaining_sec=3600,
                generated_at=1736400000
            )
        )
        
        assert response.data.chart_config.type == ChartType.SINGLE_CHART
        assert len(response.data.suggested_prompts) == 3
    
    def test_chart_config_validates_coins(self):
        """Test chart config coin validation."""
        config = ChartConfig(
            coins=["BTC", "eth"],
            type=ChartType.COMPARISON,
            timeframe=Timeframe.SEVEN_DAYS
        )
        
        assert config.coins == ["BTC", "ETH"]  # Uppercased
    
    def test_suggested_prompts_must_be_three(self):
        """Test that exactly 3 suggested prompts are required."""
        with pytest.raises(PydanticValidationError):
            ChatData(
                chart_config=ChartConfig(
                    coins=["BTC"],
                    type=ChartType.SINGLE_CHART,
                    timeframe=Timeframe.SEVEN_DAYS
                ),
                explanation="Test",
                sources=[Source(
                    type=SourceType.INTERNAL,
                    name="Test",
                    url=None
                )],
                suggested_prompts=["One", "Two"]  # Only 2
            )
    
    def test_source_url_validation(self):
        """Test source URL validation."""
        source = Source(
            type=SourceType.NEWS,
            name="CoinDesk",
            url="https://coindesk.com/article"
        )
        assert source.url.startswith("https://")
        
        # Invalid URL
        with pytest.raises(PydanticValidationError):
            Source(
                type=SourceType.NEWS,
                name="Invalid",
                url="not-a-url"
            )


class TestEnums:
    """Tests for enum types."""
    
    def test_chart_type_values(self):
        """Test ChartType enum values."""
        assert ChartType.SINGLE_CHART.value == "single_chart"
        assert ChartType.COMPARISON.value == "comparison"
        assert ChartType.MULTI_CAROUSEL.value == "multi_carousel"
        assert ChartType.NONE.value == "none"
    
    def test_timeframe_values(self):
        """Test Timeframe enum values."""
        assert Timeframe.ONE_DAY.value == "1d"
        assert Timeframe.SEVEN_DAYS.value == "7d"
        assert Timeframe.THIRTY_DAYS.value == "30d"
        assert Timeframe.THREE_SIXTY_FIVE_DAYS.value == "365d"
    
    def test_source_type_values(self):
        """Test SourceType enum values."""
        assert SourceType.NEWS.value == "news"
        assert SourceType.INTERNAL.value == "internal"
        assert SourceType.NONE.value == "none"
