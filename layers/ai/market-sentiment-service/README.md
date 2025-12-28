# Market Sentiment Service

AI microservice for analyzing cryptocurrency market sentiment using social media and web data.

## Overview

This service fetches public crypto-related content from DuckDuckGo, analyzes sentiment using VADER, and uses Google Gemini for reasoning and summarization. It provides structured JSON responses with sentiment classification, confidence scores, and risk assessments.

**Important**: This service does NOT provide financial advice. It only summarizes publicly available sentiment data.

## Features

- Fetches data from DuckDuckGo Search
- Sentiment analysis using VADER (Valence Aware Dictionary and sEntiment Reasoner)
- AI-powered summaries using Google Gemini 2.5 Flash
- Returns cited sources with titles and URLs
- Read-only, non-agentic architecture (no autonomous loops)
- Structured JSON responses
- Type-safe with Pydantic validation
- Comprehensive error handling and logging
- Docker support

## Architecture

```
┌─────────────┐
│   FastAPI   │
│   Server    │
└──────┬──────┘
       │
       ├──────> DuckDuckGo Client ───> SearchAPI.io
       │
       ├──────> Sentiment Engine ────> VADER Analysis
       │
       └──────> Gemini Client ────────> Google Gemini API
```

## API Endpoints

### POST /api/v1/sentiment

Analyze market sentiment for a cryptocurrency token.

**Request:**
```json
{
  "token": "ETH",
  "timeframe": "7d"
}
```

**Response:**
```json
{
  "sentiment": "bullish",
  "confidence": 0.75,
  "summary": "Discussions around ETH focus on ecosystem growth, adoption metrics, and upcoming protocol upgrades. Most sources highlight positive developments in decentralized finance and layer-2 scaling solutions.",
  "cited_sources": [
    {
      "title": "Ethereum News Today",
      "url": "https://example.com/eth-news"
    },
    {
      "title": "Latest ETH Developments",
      "url": "https://example.com/eth-dev"
    }
  ]
}
```

### GET /health

Health check endpoint.

## Setup

### Prerequisites

- **Python 3.11 or 3.12** (Python 3.14 is not yet supported due to pydantic-core compatibility issues)
- Virtual environment (`.venv`)
- API keys for:
  - SearchAPI.io (DuckDuckGo)
  - Google Gemini

### Environment Variables

Create a `.env` file in the project root:

```env
DUCKDUCKGO_API_KEY=your_searchapi_key
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Create and activate virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python -m uvicorn app.main:app --reload
```

The service will be available at `http://localhost:8000`

### Docker

Build and run with Docker:

```bash
docker build -t market-sentiment-service .
docker run -p 8000:8000 --env-file .env market-sentiment-service
```

## Project Structure

```
market-sentiment-service/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── api.py               # API endpoints
│   ├── schemas.py           # Pydantic models
│   └── config.py            # Configuration & env loading
├── services/
│   ├── duckduckgo_client.py # DuckDuckGo search client
│   ├── sentiment_engine.py  # VADER sentiment analysis
│   └── gemini_client.py     # Gemini LLM client
├── prompts/
│   └── market_reasoning.txt # Gemini system prompt
├── UPDATE_LOG/
│   ├── v0.1.md              # Initial version
│   └── v0.2.md              # Current version
├── requirements.txt
├── Dockerfile
├── .env                     # Environment variables (gitignored)
├── .gitignore
└── README.md
```

## Development

### Code Quality

- Type hints are used throughout
- Pydantic for request/response validation
- Comprehensive logging (not print debugging)
- Error handling with graceful degradation

### Sentiment Analysis

The service uses VADER (Valence Aware Dictionary and sEntiment Reasoner) for baseline sentiment scoring:
- Positive: compound score >= 0.05
- Negative: compound score <= -0.05
- Neutral: compound score between -0.05 and 0.05

Confidence is calculated based on sentiment distribution consistency.

### LLM Usage

Google Gemini is used for:
- Generating human-readable summaries of sentiment patterns
- Identifying key discussion themes and topics

**Sentiment Classification:**
- Determined by VADER sentiment analysis (not by LLM)
- Based on average compound score and distribution

Gemini does NOT:
- Determine sentiment (VADER does that)
- Predict prices
- Generate financial advice

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Supported Timeframes

- `1d` - Last 24 hours
- `7d` - Last 7 days
- `14d` - Last 14 days
- `30d` - Last 30 days

## Rate Limits

The service respects rate limits from:
- SearchAPI.io: Subject to plan limits
- Google Gemini: Subject to API quotas

## Security

- No hardcoded secrets
- Environment variables via `.env` file
- `.env` is gitignored
- No user data storage
- Read-only operations

## Troubleshooting

### DuckDuckGo API Issues
- Confirm SearchAPI.io API key is active
- Check API quota limits

### Gemini API Issues
- Verify Gemini API key is valid
- Ensure model name is correct (currently: `gemini-2.5-flash`)
- Check API quotas

## Version History

See `UPDATE_LOG/` directory for detailed version history and changes.

## License

Proprietary - BlackWallet Project

## Support

For issues or questions, please contact the development team.
