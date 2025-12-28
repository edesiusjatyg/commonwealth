# Market Sentiment Service - Setup Instructions

## Quick Start

This microservice is designed to run with **Python 3.11 or 3.12**.

### Option 1: Use Python 3.11/3.12 (Recommended)

If you have Python 3.11 or 3.12 installed:

```bash
# Remove existing venv
rm -rf .venv

# Create new venv with Python 3.11 or 3.12
python3.11 -m venv .venv  # or python3.12

# Activate the virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python -m uvicorn app.main:app --reload
```

### Option 2: Use Docker (Works with any system Python)

```bash
# Build Docker image
docker build -t market-sentiment-service .

# Run container
docker run -p 8000:8000 --env-file .env market-sentiment-service
```

## Python 3.14 Issue

**Note**: Python 3.14 is currently too new for some dependencies (specifically `pydantic-core`).  
The Rust compiler fails when building native extensions. Use Python 3.11 or 3.12 instead.

## Testing the Service

Once running, test with:

```bash
# Health check
curl http://localhost:8000/health

# Sentiment analysis
curl -X POST http://localhost:8000/api/v1/sentiment \
  -H "Content-Type: application/json" \
  -d '{"token": "ETH", "timeframe": "7d"}'
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

Ensure your `.env` file contains:

```env
TWITTER_API_KEY=your_key
TWITTER_API_KEY_SECRET=your_secret
DUCKDUCKGO_API_KEY=your_key
GEMINI_API_KEY=your_key
```

## Service Architecture

```
POST /api/v1/sentiment
  ↓
[Twitter Client] ──> Fetch tweets
  ↓
[DuckDuckGo Client] ──> Fetch web content
  ↓
[Sentiment Engine] ──> VADER analysis
  ↓
[Gemini Client] ──> AI reasoning
  ↓
JSON Response (sentiment, confidence, risk, summary)
```

## Features

✅ Multi-source data ingestion (Twitter, Web)  
✅ VADER sentiment analysis  
✅ AI-powered insights via Gemini  
✅ Structured JSON responses  
✅ Type-safe with Pydantic  
✅ Comprehensive error handling  
✅ Docker support  

## Documentation

- Full documentation: See `README.md`
- Change log: See `UPDATE_LOG/v0.1.md`
- API reference: http://localhost:8000/docs (when running)

## Support

For issues, please check:
1. Python version (must be 3.11 or 3.12)
2. All environment variables are set
3. Virtual environment is activated
4. Dependencies are installed correctly
