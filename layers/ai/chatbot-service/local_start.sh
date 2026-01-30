#!/bin/bash

# Local Development Startup Script
# This script starts the chatbot service locally using .env configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     AI Chatbot - Local Development Server             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${RED}✗ Please edit .env and add your GEMINI_API_KEY${NC}"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}→ Loading environment from .env...${NC}"
export $(grep -v '^#' .env | xargs)

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo -e "${RED}✗ GEMINI_API_KEY not configured in .env${NC}"
    echo -e "${YELLOW}  Please edit .env and set a valid API key${NC}"
    exit 1
fi

echo -e "${GREEN}✓ GEMINI_API_KEY configured${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 is not installed${NC}"
    echo -e "${YELLOW}  Please install Python 3.9+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python 3 found: $(python3 --version)${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠ Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
echo -e "${BLUE}→ Activating virtual environment...${NC}"
source venv/bin/activate

# Install/upgrade dependencies
echo -e "${BLUE}→ Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check if Redis is required and running
if [ "$SESSION_BACKEND" = "redis" ]; then
    echo -e "\n${BLUE}→ Checking Redis connection...${NC}"
    if ! python3 -c "import redis; r=redis.Redis.from_url('${REDIS_URL:-redis://localhost:6379/0}'); r.ping()" 2>/dev/null; then
        echo -e "${YELLOW}⚠ Redis not accessible. Using in-memory session storage${NC}"
        export SESSION_BACKEND=memory
    else
        echo -e "${GREEN}✓ Redis connected${NC}"
    fi
else
    echo -e "${BLUE}ℹ Using in-memory session storage${NC}"
fi

# Start the server
echo -e "\n${GREEN}🚀 Starting development server...${NC}\n"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

# Default values if not set in .env
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

echo -e "${GREEN}Server will start at: http://${HOST}:${PORT}${NC}"
echo -e "${GREEN}API Documentation: http://${HOST}:${PORT}/docs${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

# Run uvicorn with reload for development
uvicorn app.main:app \
    --host "$HOST" \
    --port "$PORT" \
    --reload \
    --log-level info

# Note: This will keep running until Ctrl+C
