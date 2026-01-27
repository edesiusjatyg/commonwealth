"""FastAPI application initialization."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import ValidationError, AIServiceError, SessionError
from app.api.routes import router as api_router
from app.storage.session_store import SessionStore
from app.api.dependencies import get_session_store

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("application_startup", environment=settings.environment)
    yield
    # Cleanup
    store = await get_session_store()
    await store.close()
    logger.info("application_shutdown")


app = FastAPI(
    title="AI Chatbot Microservice",
    description="Cryptocurrency market analysis chatbot with Gemini AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    """Handle validation errors."""
    logger.warning("validation_error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "message": str(exc),
            "timestamp": int(time.time())
        }
    )


@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request: Request, exc: AIServiceError):
    """Handle AI service errors."""
    logger.error("ai_service_error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=503,
        content={
            "error": "ai_service_error",
            "message": "AI service temporarily unavailable",
            "timestamp": int(time.time())
        }
    )


@app.exception_handler(SessionError)
async def session_error_handler(request: Request, exc: SessionError):
    """Handle session errors."""
    logger.error("session_error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "session_error",
            "message": "Session management error",
            "timestamp": int(time.time())
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error("unexpected_error", error=str(exc), path=request.url.path, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred",
            "timestamp": int(time.time())
        }
    )


# Health check endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "environment": settings.environment
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    try:
        store = await get_session_store()
        await store.ping()
        return {
            "status": "ready",
            "timestamp": int(time.time())
        }
    except Exception as e:
        logger.error("readiness_check_failed", error=str(e))
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "error": str(e),
                "timestamp": int(time.time())
            }
        )


# Include API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "AI Chatbot Microservice",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }
