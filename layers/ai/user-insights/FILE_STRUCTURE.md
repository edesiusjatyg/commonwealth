# User Insights Service - File Structure

## Directory Layout

```
user-insights/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── api.py               # API route handlers
│   ├── config.py            # Environment and app configuration
│   ├── database.py          # Database initialization and session management
│   ├── schemas.py           # Pydantic models and SQLAlchemy ORM models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── insight_generator.py    # LLM-based insight generation
│   │   └── comparison_service.py   # Sentiment comparison and analysis
│   └── utils/
│       ├── __init__.py
│       ├── date_utils.py       # Date and time utilities
│       └── llm_scheduler.py    # LLM call scheduling and caching logic
├── prompts/
│   └── user-insight.txt         # Gemini system prompt for insights
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Example environment configuration
├── .gitignore                   # Git ignore rules
├── Dockerfile                   # Docker container definition
├── docker-compose.yml           # Multi-container Docker setup
├── requirements.txt             # Python dependencies
├── README.md                    # Service documentation
├── FILE_STRUCTURE.md           # This file
└── start.sh (optional)         # Quick start script
```

## File Descriptions

### Application Core (`app/`)

#### `main.py`
- FastAPI application entrypoint
- Manages PostgreSQL connection lifecycle (startup/shutdown)
- Configures CORS and middleware
- Registers API routers
- Provides `/health` health check endpoint

#### `api.py`
- Defines POST `/api/v1/insights` endpoint
- Handles insight generation pipeline:
  1. Check cache for existing insights
  2. Fetch sentiment data from Market Sentiment Service
  3. Compare sentiments across user's holdings
  4. Generate personalized insight via Gemini
  5. Store result in PostgreSQL
- GET `/api/v1/insights/{user_id}` for retrieving user's insights

#### `config.py`
- Loads configuration from environment variables
- Provides `Settings` class with all app configuration
- Constructs database connection URL
- Defines API keys, model names, cache TTL, timeframes

#### `database.py`
- Initializes SQLAlchemy async engine
- Creates AsyncSession factory
- Manages connection pool (2-10 connections)
- Creates database tables on startup
- Provides dependency injection for sessions

#### `schemas.py`
- **Database Models:**
  - `UserInsightRecord` - SQLAlchemy ORM model for storing insights
- **Request/Response Models:**
  - `InsightRequest` - Validates user insight request
  - `InsightResponse` - Formatted response with insight data
  - `SourceInsight` - Individual sentiment source
  - `HealthResponse` - Health check response

### Business Logic (`services/`)

#### `insight_generator.py`
- `InsightGenerator` class for generating personalized insights
- `fetch_sentiment_data()` - Calls Market Sentiment Service for token sentiments
- `generate_insight()` - Uses Gemini to synthesize insights
- `_build_insight_prompt()` - Constructs context-aware prompts for different insight types
- `_format_sentiment_data()` - Formats sentiment data for LLM
- `_estimate_confidence()` - Calculates confidence from sentiment data

#### `comparison_service.py`
- `ComparisonService` class for comparative analysis
- `compare_sentiments()` - Groups tokens by sentiment and calculates divergence
- `identify_outliers()` - Finds tokens with unusual sentiment vs. portfolio
- Generates consensus analysis (bullish/bearish/mixed)

### Utilities (`utils/`)

#### `date_utils.py`
- `get_timeframe_for_analysis()` - Returns 7d default timeframe
- `format_datetime()` - Formats datetime objects for display
- `get_date_range()` - Calculates start/end dates for analysis window

#### `llm_scheduler.py`
- `LLMScheduler` class for managing LLM call frequency
- `should_regenerate_insight()` - Checks if cache should be refreshed (TTL-based)
- `estimate_tokens_needed()` - Estimates Gemini tokens for different request types

### Prompts (`prompts/`)

#### `user-insight.txt`
- System prompt for Gemini
- Defines role: personalized cryptocurrency insight analyst
- Core principles: ground in data, acknowledge uncertainty, avoid predictions
- Analysis framework: synthesis, divergence, risk, actionability, conviction
- Output requirements: plain text, 150-200 words, personalized, data-driven

### Configuration Files

#### `.env.example`
- Template for environment variables
- Includes: API keys, database settings, service URLs, app settings

#### `docker-compose.yml`
- Defines PostgreSQL service with 5433 port mapping
- Defines API service on port 8001
- Sets up service dependencies and health checks
- Mounts volumes for data persistence

#### `requirements.txt`
- Python package dependencies
- Core: FastAPI, Uvicorn, Pydantic
- Database: SQLAlchemy, asyncpg
- HTTP: httpx
- AI: google-generativeai
- Utilities: python-dotenv

### Documentation

#### `README.md`
- Service overview and features
- Quick start guide
- API documentation with examples
- Architecture overview
- Configuration details
- Development guidelines
- Database management
- Error handling and security

#### `FILE_STRUCTURE.md`
- This file - documents directory layout and purpose

## Database Schema

### `user_insights` Table

```sql
CREATE TABLE user_insights (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL INDEX,
  portfolio_tokens JSON,
  insight_type VARCHAR(50) NOT NULL,
  insight_text VARCHAR(2000) NOT NULL,
  confidence INTEGER,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP INDEX,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- `user_id`: Identifies the user requesting insights
- `portfolio_tokens`: List of tokens in user's holdings
- `insight_type`: Type of insight generated (portfolio, risk_analysis, sentiment_driven)
- `insight_text`: The generated insight narrative
- `confidence`: Confidence score (0-100)
- `metadata`: JSON with sources, comparison results, timeframe
- Indexed by `user_id` and `created_at` for quick lookups

## Integration Points

### With Market Sentiment Service
- Calls `POST /api/v1/sentiment` for each token
- Receives: sentiment, confidence, summary, cited_sources
- Timeframe: 7d (fixed for user insights)

### External APIs
- **Gemini API**: Generates personalized insights
- Model: `gemini-2.5-flash`
- Temperature: 0.7 (balance between determinism and creativity)
- Max tokens: 2048

## Data Flow

```
User Request (POST /api/v1/insights)
    ↓
Check Database Cache
    ├→ Cache Valid & Recent → Return Cached Insight
    └→ Cache Missing/Stale → Continue
    ↓
Fetch Sentiment Data
    └→ Market Sentiment Service (1 call per token)
    ↓
Comparison Analysis
    └→ Compare sentiments, identify outliers
    ↓
Generate Insight
    └→ Call Gemini with formatted context
    ↓
Store in Database
    └→ Save insight record with metadata
    ↓
Return Response
    └→ Send insight to client
```

## Configuration Hierarchy

1. **Environment Variables** (.env) - Highest priority
2. **Settings Class Defaults** (config.py) - Fallback values
3. **Hardcoded Defaults** - Last resort

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Requirements
- Python 3.11+
- PostgreSQL 13+
- 512MB RAM minimum
- Network access to Market Sentiment Service (port 8000)
- Network access to Gemini API

## Extension Points

1. **New Insight Types**: Add to `InsightRequest` and `_build_insight_prompt()`
2. **New Comparison Metrics**: Extend `ComparisonService`
3. **New Data Sources**: Add methods to `InsightGenerator`
4. **Custom Scheduling**: Extend `LLMScheduler`
5. **Additional Caching**: Implement Redis integration
