"""
FastAPI application entrypoint for Market Sentiment Service.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import HealthResponse
from app.api import router
from services.cache_manager import cache_manager
# Removed duplicate import of cache_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI microservice for crypto market sentiment analysis",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None
)

# CORS middleware - Restricted for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include API routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Initialize database connection and clean old cache."""
    logger.info("Connecting to database...")
    await cache_manager.connect()
    
    # Run cleanup once on startup
    logger.info("Running startup cache cleanup...")
    await cache_manager.cleanup_old_cache()
    
    logger.info("Database connection established and cache cleaned")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown."""
    logger.info("Closing database connection...")
    await cache_manager.close()
    logger.info("Database connection closed")


@app.get("/", response_model=HealthResponse, tags=["Health"])
async def root() -> HealthResponse:
    """Root endpoint for health check."""
    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug
    )