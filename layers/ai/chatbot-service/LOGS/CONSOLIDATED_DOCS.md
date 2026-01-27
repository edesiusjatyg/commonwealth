# Consolidated Documentation

## Overview
This chatbot service is a production-ready FastAPI application that uses Google's Gemini 2.5 Flash model to provide AI-powered chat responses with structured JSON output.

## Architecture

### Core Components
- **FastAPI Application**: Main web framework with health checks and chat endpoints
- **Gemini Client**: Direct integration with Google's Gemini 2.5 Flash API
- **Chat Service**: Handles message processing, context management, and response formatting
- **Session Store**: Redis-backed session management for conversation history
- **Prompt Builder**: Constructs prompts with system context and conversation history

### Models & Structure
```
app/
├── main.py                 # FastAPI application entry point
├── core/                   # Core utilities (config, logging, security)
├── api/                    # API routes and dependencies
├── models/                 # Pydantic models and system prompt
├── services/               # Business logic (chat, agent services)
├── storage/                # Session storage (Redis, memory)
└── agents/                 # Gemini client implementation
```

## Response Format

The service returns structured JSON responses:

```json
{
  "response": "The main answer text",
  "sources": [
    {
      "name": "Source Name",
      "link": "https://example.com"
    }
  ],
  "suggested_prompts": ["three word", "suggested prompts", "for user"]
}
```

## Configuration

### Environment Variables
```bash
# API Configuration
GEMINI_API_KEY=your_api_key_here
MODEL_NAME=gemini-2.5-flash

# Redis Configuration (Production)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Service Configuration
LOG_LEVEL=INFO
DEBUG=false
```

## Deployment

### Production (Docker Compose)
```bash
./prod_start.sh
```

Runs with Docker Compose, uses Redis for session storage.

### Local Development
```bash
./local_start.sh
```

Runs locally with .env file, uses in-memory storage.

## API Endpoints

### Health Check
```
GET /health
```

### Chat
```
POST /chat
{
  "message": "Your question here",
  "session_id": "optional_session_id"
}
```

## System Prompt

The system prompt is located in `app/models/SYSTEM_PROMPT.md` and configures the AI's behavior, output format, and interaction style.

## Refactoring Summary

### Key Changes
1. **Simplified Gemini Integration**: Direct API usage with gemini-2.5-flash model
2. **Structured JSON Output**: Enforced response format with sources and suggested prompts
3. **Production-Ready**: Docker Compose support with Redis session storage
4. **Clean Architecture**: Removed redundant files, consolidated documentation
5. **Two Deployment Modes**: Production (Docker) and local (.env) startup scripts

### Removed Files
- All redundant markdown documentation files
- Multiple test files (test_simple.py, test_production.py, etc.)
- Old service and agent implementations
- Duplicate configuration files

### Retained Structure
- Core application code in `app/`
- Essential startup scripts (prod_start.sh, local_start.sh)
- Version logs in `LOGS/` directory
- Unit and integration tests in `tests/` (if needed for CI/CD)

## Version History

See individual files in LOGS/ directory:
- v0.1.md: Initial implementation
- v0.2-cleanup.md: Code cleanup
- v0.3-tool-integration.md: Tool integration
- v1.0.md: Production release

## Notes

- The service uses Gemini 2.5 Flash for optimal performance
- Session management handled via Redis in production
- In-memory fallback for local development
- All responses include sources and suggested follow-up prompts
- System prompt can be customized in app/models/SYSTEM_PROMPT.md
