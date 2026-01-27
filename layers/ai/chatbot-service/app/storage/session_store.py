"""Abstract session storage interface."""

from abc import ABC, abstractmethod
from typing import Optional
from app.models.internal import SessionData


class SessionStore(ABC):
    """Abstract base class for session storage."""
    
    @abstractmethod
    async def get(self, session_id: str) -> Optional[SessionData]:
        """
        Retrieve session data by ID.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionData if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def set(self, session_id: str, session_data: SessionData, ttl: int) -> None:
        """
        Store session data with TTL.
        
        Args:
            session_id: Session identifier
            session_data: Session data to store
            ttl: Time to live in seconds
        """
        pass
    
    @abstractmethod
    async def delete(self, session_id: str) -> bool:
        """
        Delete session data.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if deleted, False if not found
        """
        pass
    
    @abstractmethod
    async def update_ttl(self, session_id: str, ttl: int) -> bool:
        """
        Update session TTL (rolling expiry).
        
        Args:
            session_id: Session identifier
            ttl: New time to live in seconds
            
        Returns:
            True if updated, False if session not found
        """
        pass
    
    @abstractmethod
    async def get_ttl(self, session_id: str) -> Optional[int]:
        """
        Get remaining TTL for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Remaining TTL in seconds, None if not found
        """
        pass
    
    @abstractmethod
    async def ping(self) -> bool:
        """
        Check if storage backend is available.
        
        Returns:
            True if available, False otherwise
        """
        pass
    
    @abstractmethod
    async def close(self) -> None:
        """Close storage connections."""
        pass
