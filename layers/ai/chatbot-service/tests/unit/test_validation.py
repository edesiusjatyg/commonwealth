"""Tests for input validation and security utilities."""

import pytest
from app.core.security import (
    escape_html,
    validate_coin,
    sanitize_input,
    validate_url
)


class TestEscapeHtml:
    """Tests for HTML escaping."""
    
    def test_removes_html_tags(self):
        """Test HTML tag removal."""
        result = escape_html("<script>alert('xss')</script>")
        assert "<script>" not in result
        assert "alert" in result
    
    def test_normalizes_whitespace(self):
        """Test whitespace normalization."""
        result = escape_html("hello    world\n\ntest")
        assert result == "hello world test"
    
    def test_handles_empty_string(self):
        """Test empty string handling."""
        result = escape_html("")
        assert result == ""


class TestValidateCoin:
    """Tests for coin symbol validation."""
    
    def test_valid_coin_uppercase(self):
        """Test valid uppercase coin."""
        result = validate_coin("BTC")
        assert result == "BTC"
    
    def test_valid_coin_lowercase(self):
        """Test lowercase coin conversion."""
        result = validate_coin("btc")
        assert result == "BTC"
    
    def test_valid_coin_mixed_case(self):
        """Test mixed case coin conversion."""
        result = validate_coin("EtH")
        assert result == "ETH"
    
    def test_invalid_coin_with_numbers(self):
        """Test rejection of coins with numbers."""
        with pytest.raises(ValueError, match="only letters"):
            validate_coin("BTC123")
    
    def test_invalid_coin_with_special_chars(self):
        """Test rejection of coins with special characters."""
        with pytest.raises(ValueError, match="only letters"):
            validate_coin("BTC$")
    
    def test_invalid_empty_coin(self):
        """Test rejection of empty coin."""
        with pytest.raises(ValueError, match="cannot be empty"):
            validate_coin("")
    
    def test_invalid_too_long(self):
        """Test rejection of too long coin."""
        with pytest.raises(ValueError, match="too long"):
            validate_coin("VERYLONGCOINNAME")


class TestSanitizeInput:
    """Tests for input sanitization."""
    
    def test_removes_null_bytes(self):
        """Test null byte rejection."""
        with pytest.raises(ValueError, match="null bytes"):
            sanitize_input("hello\x00world")
    
    def test_removes_control_characters(self):
        """Test control character rejection."""
        with pytest.raises(ValueError, match="invalid control character"):
            sanitize_input("hello\x01world")
    
    def test_allows_newlines_and_tabs(self):
        """Test that newlines and tabs are allowed."""
        result = sanitize_input("hello\nworld\ttest")
        assert result == "hello\nworld\ttest"
    
    def test_strips_whitespace(self):
        """Test whitespace stripping."""
        result = sanitize_input("  hello world  ")
        assert result == "hello world"


class TestValidateUrl:
    """Tests for URL validation."""
    
    def test_valid_http_url(self):
        """Test valid HTTP URL."""
        url = "http://example.com"
        result = validate_url(url)
        assert result == url
    
    def test_valid_https_url(self):
        """Test valid HTTPS URL."""
        url = "https://example.com/path"
        result = validate_url(url)
        assert result == url
    
    def test_invalid_no_protocol(self):
        """Test URL without protocol."""
        result = validate_url("example.com")
        assert result is None
    
    def test_invalid_wrong_protocol(self):
        """Test URL with wrong protocol."""
        result = validate_url("ftp://example.com")
        assert result is None
    
    def test_empty_url(self):
        """Test empty URL."""
        result = validate_url("")
        assert result is None
    
    def test_none_url(self):
        """Test None URL."""
        result = validate_url(None)
        assert result is None
