"""Custom exceptions for the chatbot service."""


class ChatbotException(Exception):
    """Base exception for chatbot service."""
    
    def __init__(self, message: str, error_type: str = "internal_error"):
        self.message = message
        self.error_type = error_type
        super().__init__(message)


class ValidationError(ChatbotException):
    """Input validation error."""
    
    def __init__(self, message: str, field: str = None):
        super().__init__(message, error_type="validation_error")
        self.field = field


class RateLimitError(ChatbotException):
    """Rate limit exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, error_type="rate_limit_error")


class TimeoutError(ChatbotException):
    """Request timeout."""
    
    def __init__(self, message: str = "Request timeout"):
        super().__init__(message, error_type="timeout_error")


class SessionError(ChatbotException):
    """Session-related error."""
    
    def __init__(self, message: str):
        super().__init__(message, error_type="session_error")


class ToolExecutionError(ChatbotException):
    """Tool execution error."""
    
    def __init__(self, message: str, tool_name: str = None):
        super().__init__(message, error_type="tool_execution_error")
        self.tool_name = tool_name


class AIServiceError(ChatbotException):
    """AI service (Gemini) error."""
    
    def __init__(self, message: str):
        super().__init__(message, error_type="ai_service_error")
