#!/bin/bash

# Market Sentiment Service - Quick Start Script
# This script will set up and run the service

set -e

echo "Market Sentiment Service - Quick Start"
echo ""

# Check Python version
PYTHON_CMD=""
for cmd in python3.11 python3.12 python3; do
    if command -v $cmd &> /dev/null; then
        VERSION=$($cmd --version 2>&1 | awk '{print $2}')
        MAJOR=$(echo $VERSION | cut -d. -f1)
        MINOR=$(echo $VERSION | cut -d. -f2)
        
        if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 11 ] && [ "$MINOR" -le 12 ]; then
            PYTHON_CMD=$cmd
            echo "Found compatible Python: $VERSION"
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
    echo "   - Or use Docker: docker build -t market-sentiment-service ."
    exit 1
fi

echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "   Please create a .env file with your API keys"
    exit 1
fi

echo "Found .env file"
echo ""

# Remove old venv if exists and is wrong Python version
if [ -d .venv ]; then
    echo "Removing old virtual environment..."
    rm -rf .venv
fi

# Create virtual environment
echo "Creating virtual environment with $PYTHON_CMD..."
$PYTHON_CMD -m venv .venv

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo ""
echo "Setup complete!"
echo ""
echo " Starting Market Sentiment Service..."
echo "   API will be available at: http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo "   Health check: http://localhost:8000/health"
echo ""
echo "   Press Ctrl+C to stop the service"
echo ""
echo "=========================================="
echo ""

# Run the service
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
