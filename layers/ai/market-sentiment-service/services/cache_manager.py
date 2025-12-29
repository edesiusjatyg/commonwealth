"""
Cache manager for storing and retrieving sentiment analysis results.
"""
import logging
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import asyncpg
from app.config import settings

logger = logging.getLogger(__name__)


class CacheManager:
    """Manages caching of sentiment analysis and article content using PostgreSQL."""
    
    def __init__(self):
        self.pool = None
        self._connection_string = (
            f"postgresql://{settings.postgres_user}:{settings.postgres_password}"
            f"@{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"
        )
    
    async def connect(self):
        """Establish database connection pool."""
        if not self.pool:
            try:
                self.pool = await asyncpg.create_pool(
                    self._connection_string,
                    min_size=2,
                    max_size=10,
                    command_timeout=60
                )
                logger.info("Database connection pool created")
                await self._init_db()
            except Exception as e:
                logger.error(f"Failed to create database pool: {str(e)}")
                raise
    
    async def close(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def _init_db(self):
        """Initialize database tables."""
        async with self.pool.acquire() as conn:
            # Articles table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS articles (
                    id SERIAL PRIMARY KEY,
                    token TEXT NOT NULL,
                    timeframe TEXT NOT NULL,
                    url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    published_date TEXT,
                    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(token, timeframe, url)
                )
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_articles_lookup 
                ON articles(token, timeframe, fetched_at)
            """)
            
            # Query Tracking table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS query_tracking (
                    id SERIAL PRIMARY KEY,
                    token TEXT NOT NULL,
                    timeframe TEXT NOT NULL,
                    query_date DATE NOT NULL,
                    query_count INTEGER DEFAULT 1,
                    sentiment TEXT,
                    confidence REAL,
                    summary TEXT,
                    cited_sources JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(token, timeframe, query_date)
                )
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_query_tracking_lookup 
                ON query_tracking(token, timeframe, query_date)
            """)
            logger.info("Database schema initialized")
    
    async def get_cached_articles(self, token: str, timeframe: str) -> Optional[tuple[List[str], List[Dict[str, str]]]]:
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            current_date = datetime.now()
            cutoff_date = current_date - timedelta(days=settings.article_cache_ttl_days)
            
            rows = await conn.fetch("""
                SELECT content, title, url, published_date
                FROM articles 
                WHERE token = $1 AND timeframe = $2 AND fetched_at > $3
                ORDER BY fetched_at DESC
            """, token, timeframe, cutoff_date)
            
            if rows:
                texts = [row['content'] for row in rows]
                sources = [
                    {
                        "title": row['title'],
                        "url": row['url'],
                        "date": row['published_date'] or "Unknown"
                    }
                    for row in rows
                ]
                logger.info(f"Article cache hit for {token} {timeframe}: {len(texts)} articles")
                return texts, sources
            return None
    
    async def cache_articles(self, token: str, timeframe: str, articles: List[Dict[str, str]]):
        """Store articles in cache using batch insert for performance."""
        if not self.pool:
            await self.connect()
        
        # Prepare data for batch insert
        # Format: (token, timeframe, url, title, content, published_date)
        records = [
            (
                token,
                timeframe,
                a.get('url', ''),
                a.get('title', ''),
                a.get('content', ''),
                a.get('published_date', 'Unknown')
            )
            for a in articles
        ]
        
        if not records:
            return

        async with self.pool.acquire() as conn:
            try:
                # Optimized batch insert with ON CONFLICT handling
                await conn.executemany("""
                    INSERT INTO articles (token, timeframe, url, title, content, published_date)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (token, timeframe, url) 
                    DO UPDATE SET
                        title = EXCLUDED.title,
                        content = EXCLUDED.content,
                        published_date = EXCLUDED.published_date,
                        fetched_at = CURRENT_TIMESTAMP
                """, records)
                logger.info(f"Cached {len(records)} articles for {token} {timeframe}")
            except Exception as e:
                logger.error(f"Failed to cache articles: {str(e)}")

    async def get_sentiment_cache(self, token: str, timeframe: str, current_date: datetime.date) -> Optional[Dict[str, Any]]:
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT sentiment, confidence, summary, cited_sources, query_count
                FROM query_tracking 
                WHERE token = $1 AND timeframe = $2 AND query_date = $3
            """, token, timeframe, current_date)
            
            # Logic: Return cache if we haven't hit the 'refresh limit' (e.g., 10 views)
            if row and row['query_count'] < settings.max_queries_per_token_timeframe:
                await conn.execute("""
                    UPDATE query_tracking 
                    SET query_count = query_count + 1, 
                        last_accessed = CURRENT_TIMESTAMP
                    WHERE token = $1 AND timeframe = $2 AND query_date = $3
                """, token, timeframe, current_date)
                
                logger.info(f"Sentiment cache hit for {token} (View {row['query_count'] + 1})")
                return {
                    "sentiment": row['sentiment'],
                    "confidence": row['confidence'],
                    "summary": row['summary'],
                    "cited_sources": json.loads(row['cited_sources']) if row['cited_sources'] else []
                }
            elif row:
                logger.info(f"Sentiment cache stale (limit reached) for {token}")
            
            return None

    # Renamed from set_sentiment_cache to match typical convention, but check your API usage!
    async def set_sentiment_cache(
        self,
        token: str,
        timeframe: str,
        query_date: datetime.date,
        sentiment: str,
        confidence: float,
        summary: str,
        cited_sources: List[Dict[str, str]]
    ):
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            # We dump the list to a JSON string for the JSONB column
            sources_json = json.dumps(cited_sources)
            
            await conn.execute("""
                INSERT INTO query_tracking 
                (token, timeframe, query_date, sentiment, confidence, summary, cited_sources, query_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
                ON CONFLICT (token, timeframe, query_date)
                DO UPDATE SET
                    sentiment = EXCLUDED.sentiment,
                    confidence = EXCLUDED.confidence,
                    summary = EXCLUDED.summary,
                    cited_sources = EXCLUDED.cited_sources,
                    query_count = 1,
                    created_at = CURRENT_TIMESTAMP,
                    last_accessed = CURRENT_TIMESTAMP
            """, token, timeframe, query_date, sentiment, confidence, summary, sources_json)
            
            logger.info(f"Sentiment result saved to cache for {token}")

    async def cleanup_old_cache(self):
        """Removes data older than TTL."""
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            # Delete articles older than TTL
            cutoff_date = datetime.now() - timedelta(days=settings.article_cache_ttl_days)
            await conn.execute("DELETE FROM articles WHERE fetched_at < $1", cutoff_date)
            
            # Delete query tracking from previous days
            current_date = datetime.now().date()
            await conn.execute("DELETE FROM query_tracking WHERE query_date < $1", current_date)
            
            logger.info("Cache cleanup completed")

cache_manager = CacheManager()