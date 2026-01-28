# AI Chatbot Service

Production-ready FastAPI chatbot service using Google's Gemini 2.5 Flash model.

## Quick Start

### Production (Docker Compose)
```bash
./prod_start.sh
```

### Local Development
```bash
./local_start.sh
```

## Configuration

Copy `.env.example` to `.env` and configure:
```bash
GEMINI_API_KEY=your_api_key_here
```

## Documentation

See **[LOGS/CONSOLIDATED_DOCS.md](LOGS/CONSOLIDATED_DOCS.md)** for complete documentation including:
- Architecture overview
- API endpoints
- Response format
- Deployment options
- Configuration details

## API Endpoints

- **Health Check**: `GET /health`
- **Chat**: `POST /chat`

### Example Usage

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_message": "Compare BTC and ETH over the last week"}'
```


## Response Format

```json
{
  "data": {
    "coins": ["BTC", "ETH"],
    "type": "comparison",
    "timeframe": "7d",
    "explanation": "Bitcoin (BTC) and Ethereum (ETH) have shown divergent trends..."
  },
  "suggested_next_prompts": [
    "Compare BTC vs SOL",
    "Show ETH support levels",
    "Why is ETH moving up?"
  ],
  "meta": {
    "session_id": "abc123",
    "ttl_remaining_sec": 3600,
    "generated_at": 1738001385
  }
}
```

## Project Structure

```
app/
├── main.py              # FastAPI application
├── core/                # Config, logging, security
├── api/                 # Routes and dependencies
├── models/              # Pydantic models + system prompt
├── services/            # Chat and agent services
├── storage/             # Session storage (Redis/memory)
└── agents/              # Gemini client
```

## Requirements

- Python 3.9+
- Redis (production) or in-memory storage (local)
- Google Gemini API key

---

For detailed documentation, see [LOGS/CONSOLIDATED_DOCS.md](LOGS/CONSOLIDATED_DOCS.md)
