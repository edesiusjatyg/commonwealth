"""Security utilities for input validation and sanitization."""

import re
from typing import Optional
import bleach


def escape_html(text: str) -> str:
    """
    Remove HTML tags and escape special characters.
    
    Args:
        text: Input text that may contain HTML
        
    Returns:
        Cleaned text with HTML removed and normalized whitespace
    """
    # Strip all HTML tags
    cleaned = bleach.clean(text, tags=[], strip=True)
    # Normalize whitespace
    return " ".join(cleaned.split())


def validate_coin(coin: str) -> str:
    """
    Validate and normalize coin symbol.
    
    Args:
        coin: Coin symbol to validate
        
    Returns:
        Normalized uppercase coin symbol
        
    Raises:
        ValueError: If coin symbol is invalid
    """
    normalized = coin.strip().upper()
    
    if not normalized:
        raise ValueError("Coin symbol cannot be empty")
    
    if not normalized.isalpha():
        raise ValueError(f"Coin symbol must contain only letters: {coin}")
    
    if len(normalized) > 10:
        raise ValueError(f"Coin symbol too long: {coin}")
    
    return normalized


def sanitize_input(text: str) -> str:
    """
    Sanitize user input for safe processing.
    
    Args:
        text: User input text
        
    Returns:
        Sanitized text
        
    Raises:
        ValueError: If text contains invalid characters
    """
    # Strip whitespace
    cleaned = text.strip()
    
    # Check for null bytes
    if '\x00' in cleaned:
        raise ValueError("Input contains null bytes")
    
    # Check for control characters (except newline, carriage return, tab)
    for char in cleaned:
        if ord(char) < 32 and char not in '\n\r\t':
            raise ValueError(f"Input contains invalid control character: {repr(char)}")
    
    return cleaned


def validate_url(url: str) -> Optional[str]:
    """
    Validate URL and return it if valid, None otherwise.
    
    Args:
        url: URL to validate
        
    Returns:
        The URL if valid, None otherwise
    """
    if not url:
        return None
    
    url = url.strip()
    
    # Must start with http:// or https://
    if not url.startswith(("http://", "https://")):
        return None
    
    # Basic URL pattern validation
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    
    if url_pattern.match(url):
        return url
    
    return None


def sanitize_for_prompt(text: str) -> str:
    """
    Sanitize text before including in AI prompt.
    This prevents prompt injection attempts.
    
    Args:
        text: Text to sanitize
        
    Returns:
        Sanitized text safe for prompt inclusion
    """
    # Remove HTML
    cleaned = escape_html(text)
    
    # Remove any embedded JSON or structured data attempts
    # This prevents injection like: {"role": "system", "content": "..."}
    if any(marker in cleaned.lower() for marker in ['"role":', '"system":', '"user":', '"assistant":']):
        # Strip out potential JSON structures
        cleaned = re.sub(r'\{[^}]*"role"[^}]*\}', '', cleaned, flags=re.IGNORECASE)
    
    return cleaned.strip()


def validate_session_id(session_id: Optional[str]) -> Optional[str]:
    """
    Validate session ID format.
    
    Args:
        session_id: Session ID to validate
        
    Returns:
        Valid session ID or None
    """
    if not session_id:
        return None
    
    normalized = session_id.strip()
    
    if not normalized:
        return None
    
    # Must be alphanumeric with hyphens/underscores only
    if not re.match(r'^[a-zA-Z0-9_-]+$', normalized):
        return None
    
    if len(normalized) > 100:
        return None
    
    return normalized
