# README Update - Complete Documentation Overhaul

**Date:** December 29, 2025  
**Version:** 0.6.0+

## Summary

Comprehensive update to README.md to reflect the current production architecture (LangSearch + PostgreSQL) with detailed fail case documentation and complete flow explanations.

## Changes Made

### 1. Architecture Section - Fully Rewritten

**Updated to reflect:**
- LangSearch API (replaced DuckDuckGo references)
- PostgreSQL caching (replaced SQLite references)
- Two-tier cache strategy (articles: 30 days, sentiment: per day)
- Query limits (10 queries/day per token/timeframe)
- Complete flow diagram with all decision points

**Removed:**
- All references to DuckDuckGo/SearchAPI.io
- All references to SQLite/cache.db
- Outdated cache TTL logic (3d, 15d timeframes)

**Added:**
- Detailed architecture diagram (already exists as ASCII art)
- Flow explanation with 8 numbered steps
- Comprehensive fail case table
- Cache hit/miss logic explanation

### 2. Fail Cases - Comprehensive Documentation

Added detailed fail case scenarios for every step:

#### Step 1: Request Validation
- **Fail:** Invalid timeframe → 422 Validation Error

#### Step 2: Sentiment Cache Check
- **Fail 1:** Cache exists but query_count >= 10 → Return cached (no API calls)
- **Fail 2:** New day detected → Reset query count, proceed to fresh generation

#### Step 3: Article Cache Check
- **Fail:** No articles OR articles > 30 days old → Call LangSearch API

#### Step 4: LangSearch API Call
- **Fail 1:** API error (timeout, 401, 500) → Neutral sentiment fallback (graceful)
- **Fail 2:** 0 results returned → Neutral sentiment fallback
- **Fail 3:** All results are Wikipedia → Filtered out → Neutral fallback

#### Step 5: VADER Analysis
- **Fail:** Empty texts → Should not happen (caught in step 4)

#### Step 6: Gemini LLM Summary
- **Fail 1:** Gemini API error → Fallback: "AI reasoning unavailable. Sentiment based on keyword density."
- **Fail 2:** Empty response → Fallback summary
- **Fail 3:** Response with markdown → Strip code blocks automatically

#### Step 7: Cache Sentiment
- **Fail:** Database error → Log warning, still return response (non-blocking)

#### Step 8: Return Response
- **Success:** Full response with all data
- **Graceful Degradation:** Neutral fallback with message

### 3. Fail Case Summary Table

Added comprehensive table showing:
- Scenario
- Behavior
- HTTP Status Code

**Key Principle:** Service NEVER crashes on empty data. Always returns valid response.

| Scenario | Behavior | HTTP Status |
|----------|----------|-------------|
| Invalid timeframe | Validation error | 422 |
| LangSearch API error | Neutral fallback | 200 (graceful) |
| No results from LangSearch | Neutral fallback | 200 (graceful) |
| All Wikipedia results | Neutral fallback | 200 (graceful) |
| Gemini API error | Use VADER sentiment + fallback summary | 200 (graceful) |
| Database cache error | Log warning, continue | 200 (non-blocking) |
| Unexpected error | Internal server error | 500 |

### 4. API Endpoints Section - Updated

**Request/Response Examples:**
- Updated to show current timeframes: 1d, 7d, 30d, 365d (removed 3d, 15d)
- Added date field to cited_sources examples
- Clarified graceful degradation behavior

**Supported Timeframes Table:**
- Added LangSearch freshness filter mapping
- Explained cache behavior for each timeframe

### 5. Setup Section - PostgreSQL Instructions

**Prerequisites:**
- Removed Python 3.14 compatibility warning
- Added Docker and Docker Compose requirement
- Updated API key references (LANGCHAIN_API_KEY instead of DUCKDUCKGO_API_KEY)

**Environment Variables:**
- Complete .env example with PostgreSQL settings
- Removed DuckDuckGo references

**Installation Steps:**
- Added Docker Compose PostgreSQL startup
- Updated Docker instructions for full stack

### 6. Project Structure - Current Files

**Updated structure to show:**
- `langsearch_client.py` (not duckduckgo_client.py)
- `cache_manager.py` (not cache_service.py)
- `docker-compose.yml` (not just Dockerfile)
- Current UPDATE_LOG files (v0.1 through v0.6)

**Removed:**
- `data/` directory reference (no longer using SQLite)
- `cache.db` references

### 7. File Descriptions - Detailed Updates

**app/main.py:**
- Added PostgreSQL connection pool lifecycle management
- Clarified database startup/shutdown behavior

**app/api.py:**
- Updated orchestration flow (8 steps)
- Emphasized graceful fallback logic
- "Always returns valid response (never crashes on empty data)"

**app/schemas.py:**
- Updated timeframes: 1d, 7d, 30d, 365d (removed 3d, 15d)
- Added date field to SourceCitation

**app/config.py:**
- Updated to show PostgreSQL settings
- Changed LANGCHAIN_API_KEY (not DUCKDUCKGO_API_KEY)
- Updated cache settings (article_cache_ttl_days, max_queries_per_token_timeframe)
- max_langsearch_results: 5 (not max_duckduckgo_results: 50)

**services/langsearch_client.py:**
- Complete rewrite of description
- Freshness mapping explanation (1d→oneDay, 7d→oneWeek, etc.)
- Wikipedia/Wiktionary filtering
- Robust error handling details
- Timeout: 10 seconds (not 5)

**services/gemini_client.py:**
- Updated to reflect single narrative prompt (no redundant system prompt)
- Clarified fallback summary behavior

**services/cache_manager.py:**
- Complete rewrite (was cache_service.py)
- Two-tier caching strategy explained
- PostgreSQL connection pooling
- Batch insert for articles
- Database schema documentation
- Query limit and refresh logic

**prompts/market_reasoning.txt:**
- Updated constraints: 100 words (not 300-500)
- Plain text only (no markdown/emojis/special formatting)
- Interpret "hype" as psychological signal

### 8. Supported Timeframes - New Table

Added comprehensive table with:
- Timeframe
- Description
- LangSearch Filter mapping
- Cache Behavior

**Caching Strategy section:**
- Article cache: 30 days (all timeframes)
- Sentiment cache: per day with query limit
- Query limit: 10 queries per token/timeframe/day
- Refresh logic explanation

### 9. Development Section - Async Patterns

Added:
- PostgreSQL connection pooling with asyncpg
- Async/await patterns for database operations
- Updated LLM usage description (100-word summaries)

### 10. API Documentation & Rate Limits

**Updated:**
- Production note: API docs disabled when debug=False
- LangSearch API quotas (free tier: 100 requests/day)
- Gemini API quotas (free tier: 1500 requests/day)
- Internal rate limiting explanation

### 11. Security Section - PostgreSQL

**Added:**
- PostgreSQL connection with password authentication
- Database stores only token/timeframe/sentiment data (no user identifiers)

**Updated:**
- Input sanitization to reference LangSearch (not DuckDuckGo)
- Updated allowed punctuation characters

### 12. Troubleshooting - Comprehensive Guide

Completely rewritten troubleshooting section:

**Added sections:**
- PostgreSQL Connection Issues (container, connection settings, logs)
- LangSearch API Issues (API key, quotas, endpoint verification)
- Gemini API Issues (API key, model name, quotas)
- Cache Not Working (database verification, table checks, reset commands)
- Empty Results or Neutral Fallback (expected behavior explanation)

**Removed:**
- DuckDuckGo troubleshooting

### 13. Health Check Version

Updated health check response version: 0.6.0 (was 0.3.0)

## Documentation Principles Applied

1. **No Emojis:** All checkmarks (✅) removed from features list
2. **Accuracy:** Every reference to DuckDuckGo/SQLite replaced with LangSearch/PostgreSQL
3. **Completeness:** Every fail case documented with behavior and HTTP status
4. **Clarity:** Architecture flow explained step-by-step with decision points
5. **Production-Ready:** Security, rate limits, troubleshooting all comprehensive

## Files Modified

- `README.md` - Complete overhaul (661 lines)

## Files Referenced (Not Modified)

- `market_sentiment_architecture.png` - Architecture diagram (should exist in repo root)
- `app/main.py` - FastAPI entrypoint
- `app/api.py` - API orchestration
- `app/schemas.py` - Pydantic models
- `app/config.py` - Configuration
- `services/langsearch_client.py` - LangSearch API client
- `services/sentiment_engine.py` - VADER analysis
- `services/gemini_client.py` - Gemini LLM client
- `services/cache_manager.py` - PostgreSQL cache
- `prompts/market_reasoning.txt` - System prompt
- `docker-compose.yml` - Docker services
- `UPDATE_LOG/v0.1.md` through `UPDATE_LOG/v0.6.md` - Version history

## Verification Checklist

- [x] All DuckDuckGo references removed
- [x] All SQLite references removed
- [x] All outdated timeframes (3d, 15d) removed
- [x] LangSearch API fully documented
- [x] PostgreSQL caching fully documented
- [x] All 8 architecture steps explained
- [x] All fail cases documented with HTTP status codes
- [x] Fail case summary table added
- [x] Graceful degradation principle emphasized
- [x] Neutral fallback behavior explained
- [x] Cache strategy (articles: 30 days, sentiment: per day) clarified
- [x] Query limit (10/day) explained
- [x] LangSearch freshness mapping documented
- [x] Wikipedia filtering explained
- [x] Gemini prompt simplification (single narrative) documented
- [x] PostgreSQL connection pooling mentioned
- [x] Docker Compose instructions added
- [x] Troubleshooting section comprehensive
- [x] Security section updated for PostgreSQL
- [x] Version numbers updated to 0.6.0
- [x] No emojis in documentation

## Next Steps (Optional)

1. **Create/Update Architecture Diagram:** Ensure `market_sentiment_architecture.png` exists and reflects current flow
2. **Review with Team:** Share updated README for team review
3. **User Testing:** Verify documentation clarity with new users
4. **Continuous Updates:** Keep README in sync with future architecture changes

## Notes

- README is now production-grade and comprehensive
- All fail cases are documented with clear behavior expectations
- Documentation follows enterprise standards (no emojis, clear structure)
- Troubleshooting section provides actionable steps for common issues
- Architecture section provides complete understanding of data flow and decision logic
