#!/bin/bash

# Market Sentiment Service - Quick Start Script
# This script will set up PostgreSQL, Python environment, and run the service

set -e

echo "=========================================="
echo "Market Sentiment Service - Quick Start"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is required but not installed"
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✓ Docker found"

# Check Python version
PYTHON_CMD=""
for cmd in python3.11 python3.12 python3; do
    if command -v $cmd &> /dev/null; then
        VERSION=$($cmd --version 2>&1 | awk '{print $2}')
        MAJOR=$(echo $VERSION | cut -d. -f1)
        MINOR=$(echo $VERSION | cut -d. -f2)
        
        if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 11 ] && [ "$MINOR" -le 12 ]; then
            PYTHON_CMD=$cmd
            echo "✓ Found compatible Python: $VERSION"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "Error: Python 3.11 or 3.12 required"
    echo "   Current system Python is too old or too new (3.14 not supported)"
    echo ""
    echo "   Please install Python 3.11 or 3.12:"
    echo "   - Ubuntu/Debian: sudo apt install python3.11"
    echo "   - macOS: brew install python@3.11"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "   Please create a .env file with your API keys"
    exit 1
fi

echo "✓ Found .env file"
echo ""

# Setup PostgreSQL Database
echo "=========================================="
echo "Setting up PostgreSQL Database"
echo "=========================================="

# Load database config from .env or use defaults
source .env
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_DB=${POSTGRES_DB:-market_sentiment}
POSTGRES_USER=${POSTGRES_USER:-sentiment_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-sentiment_pass}
CONTAINER_NAME="market-sentiment-postgres"

# Remove any conflicting containers
EXISTING_CONTAINERS=$(docker ps -a --format '{{.Names}}' | grep "^${CONTAINER_NAME}$" || true)
if [ -n "$EXISTING_CONTAINERS" ]; then
    echo "  Removing existing container..."
    docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1 || true
fi

# Check if container already exists (after cleanup)
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✓ PostgreSQL container '${CONTAINER_NAME}' exists"
    
    # Check if container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✓ Container is running"
        
        # Validate database connection and tables
        echo "  Validating database schema..."
        VALID=$(docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -tAc \
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('articles', 'query_tracking');" 2>/dev/null || echo "0")
        
        if [ "$VALID" = "2" ]; then
            echo "✓ Database schema is valid"
        else
            echo "⚠ Database schema invalid or incomplete, will be recreated by application"
        fi
    else
        echo "  Starting existing container..."
        docker start ${CONTAINER_NAME}
        echo "✓ Container started"
        sleep 2
    fi
else
    echo "  Creating new PostgreSQL container..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -e POSTGRES_DB=${POSTGRES_DB} \
        -e POSTGRES_USER=${POSTGRES_USER} \
        -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
        -p ${POSTGRES_PORT}:5432 \
        -v market-sentiment-pgdata:/var/lib/postgresql/data \
        postgres:16-alpine
    
    echo "✓ PostgreSQL container created"
    echo "  Waiting for database to be ready..."
    sleep 5
    
    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec ${CONTAINER_NAME} pg_isready -U ${POSTGRES_USER} > /dev/null 2>&1; then
            echo "✓ Database is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "Error: Database failed to start"
            exit 1
        fi
        sleep 1
    done
fi

echo ""

# Setup Python Environment
echo "=========================================="
echo "Setting up Python Environment"
echo "=========================================="

# Check if venv exists and is valid
VENV_VALID=false
if [ -d .venv ]; then
    echo "✓ Virtual environment exists"
    
    # Check if it's using the correct Python version
    if [ -f .venv/bin/python ]; then
        VENV_VERSION=$(.venv/bin/python --version 2>&1 | awk '{print $2}')
        CURRENT_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
        
        if [ "$VENV_VERSION" = "$CURRENT_VERSION" ]; then
            echo "✓ Virtual environment Python version matches ($VENV_VERSION)"
            VENV_VALID=true
        else
            echo "⚠ Virtual environment Python version mismatch"
            echo "  Removing old virtual environment..."
            rm -rf .venv
        fi
    fi
else
    echo "  Virtual environment not found"
fi

# Create venv if needed
if [ "$VENV_VALID" = false ]; then
    echo "  Creating virtual environment with $PYTHON_CMD..."
    $PYTHON_CMD -m venv .venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
source .venv/bin/activate

# Check if dependencies need to be installed
DEPS_VALID=false
if [ -f .venv/.deps_installed ]; then
    # Check if requirements.txt has changed
    REQUIREMENTS_HASH=$(md5sum requirements.txt | awk '{print $1}')
    INSTALLED_HASH=$(cat .venv/.deps_installed 2>/dev/null || echo "")
    
    if [ "$REQUIREMENTS_HASH" = "$INSTALLED_HASH" ]; then
        echo "✓ Dependencies are up to date"
        DEPS_VALID=true
    else
        echo "  Requirements changed, reinstalling dependencies..."
    fi
else
    echo "  Dependencies not yet installed"
fi

# Install dependencies if needed
if [ "$DEPS_VALID" = false ]; then
    echo "  Installing dependencies..."
    pip install --quiet --upgrade pip
    pip install --quiet -r requirements.txt
    
    # Save hash of requirements.txt
    md5sum requirements.txt | awk '{print $1}' > .venv/.deps_installed
    echo "✓ Dependencies installed"
fi

echo ""
echo "=========================================="
echo "Starting Market Sentiment Service"
echo "=========================================="
echo ""
echo "  API will be available at: http://localhost:8001"
echo "  API docs: http://localhost:8001/docs (debug mode only)"
echo "  Health check: http://localhost:8001/health"
echo ""
echo "  Press Ctrl+C to stop the service"
echo ""

# Run the service
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

