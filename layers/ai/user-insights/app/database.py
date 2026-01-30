"""
MySQL-backed database layer using SQLAlchemy.
Stores user insights with TTL (expires_at) and provides CRUD helpers.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import json
import logging

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    JSON as SAJSON,
    Index,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from .config import settings

Base = declarative_base()

logger = logging.getLogger(__name__)

# Global engine and session factory
engine = None
async_session_maker = None


class InsightModel(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(128), index=True, nullable=False)
    insight_data = Column(SAJSON, nullable=False)
    created_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)


Index("ix_insights_user_created", InsightModel.user_id, InsightModel.created_at)


class InsightDatabase:
    def __init__(self, database_url: str, retention_days: int = 90):
        self.engine = create_engine(database_url, pool_pre_ping=True)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.retention_days = retention_days
        # create tables if not present
        Base.metadata.create_all(bind=self.engine)

    def _session(self) -> Session:
        return self.SessionLocal()

    def save_insight(self, user_id: str, insight_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow()
        expires_at = now + timedelta(days=self.retention_days)
        session = self._session()
        try:
            model = InsightModel(
                user_id=user_id,
                insight_data=insight_data,
                created_at=now,
                expires_at=expires_at,
            )
            session.add(model)
            session.commit()
            session.refresh(model)
            return {
                "id": model.id,
                "user_id": model.user_id,
                "insight_data": model.insight_data,
                "created_at": model.created_at,
                "expires_at": model.expires_at,
            }
        finally:
            session.close()

    def get_latest_insight(self, user_id: str) -> Optional[Dict[str, Any]]:
        session = self._session()
        try:
            # Filter expired
            now = datetime.utcnow()
            q = (
                session.query(InsightModel)
                .filter(InsightModel.user_id == user_id)
                .filter(InsightModel.expires_at > now)
                .order_by(InsightModel.created_at.desc())
                .limit(1)
            )
            result = q.first()
            if not result:
                return None
            return {
                "id": result.id,
                "user_id": result.user_id,
                "insight_data": result.insight_data,
                "created_at": result.created_at,
                "expires_at": result.expires_at,
            }
        finally:
            session.close()

    def get_insights_by_date_range(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        session = self._session()
        try:
            q = (
                session.query(InsightModel)
                .filter(InsightModel.user_id == user_id)
                .filter(InsightModel.created_at >= start_date)
                .filter(InsightModel.created_at <= end_date)
                .filter(InsightModel.expires_at > datetime.utcnow())
                .order_by(InsightModel.created_at.desc())
            )
            results = []
            for r in q.all():
                results.append({
                    "id": r.id,
                    "user_id": r.user_id,
                    "insight_data": r.insight_data,
                    "created_at": r.created_at,
                    "expires_at": r.expires_at,
                })
            return results
        finally:
            session.close()

    def cleanup_expired(self) -> int:
        session = self._session()
        try:
            now = datetime.utcnow()
            deleted = session.query(InsightModel).filter(InsightModel.expires_at <= now).delete()
            session.commit()
            return deleted
        finally:
            session.close()

    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        session = self._session()
        try:
            total = session.query(InsightModel).filter(InsightModel.user_id == user_id).count()
            now = datetime.utcnow()
            valid = session.query(InsightModel).filter(InsightModel.user_id == user_id).filter(InsightModel.expires_at > now).count()
            expired = total - valid
            oldest = (
                session.query(InsightModel)
                .filter(InsightModel.user_id == user_id)
                .filter(InsightModel.expires_at > now)
                .order_by(InsightModel.created_at.asc())
                .first()
            )
            newest = (
                session.query(InsightModel)
                .filter(InsightModel.user_id == user_id)
                .filter(InsightModel.expires_at > now)
                .order_by(InsightModel.created_at.desc())
                .first()
            )
            return {
                "user_id": user_id,
                "total_insights": total,
                "valid_insights": valid,
                "expired_insights": expired,
                "retention_days": self.retention_days,
                "oldest_valid_record": oldest.created_at if oldest else None,
                "newest_valid_record": newest.created_at if newest else None,
            }
        finally:
            session.close()


async def init_db():
    """Initialize database connection pool."""
    global engine, async_session_maker
    
    try:
        engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True
        )
        
        async_session_maker = async_sessionmaker(
            engine, 
            class_=AsyncSession, 
            expire_on_commit=False
        )
        
        # Create tables
        from .schemas import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_db():
    """Close database connection pool."""
    global engine
    if engine:
        await engine.dispose()
        logger.info("Database connection closed")


async def get_session() -> AsyncSession:
    """Get database session."""
    if async_session_maker is None:
        raise RuntimeError("Database not initialized")
    async with async_session_maker() as session:
        yield session


# Lazy initialization of global DB instance
_db_instance = None

def get_db() -> InsightDatabase:
    """Get the InsightDatabase instance (lazy initialization)."""
    global _db_instance
    if _db_instance is None:
        _db_instance = InsightDatabase(
            settings.sqlalchemy_database_url, 
            retention_days=settings.data_retention_days
        )
    return _db_instance

# For backward compatibility - will fail on first access if DB not available
db = None  # Will be initialized lazily
