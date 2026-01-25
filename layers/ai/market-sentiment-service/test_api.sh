#!/bin/bash

# Test script for Market Sentiment API

echo "=========================================="
echo "Market Sentiment API Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s http://localhost:8000/health)
if echo "$response" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: First sentiment query (should call DuckDuckGo + Gemini)
echo -e "${YELLOW}Test 2: First Sentiment Query (BTC, 3d)${NC}"
echo "This should fetch from DuckDuckGo and call Gemini LLM..."
response=$(curl -s -X POST http://localhost:8000/api/v1/sentiment \
  -H "Content-Type: application/json" \
  -d '{"token": "BTC", "timeframe": "3d"}')

if echo "$response" | grep -q "sentiment"; then
    echo -e "${GREEN}✓ First query successful${NC}"
    echo "Response preview:"
    echo "$response" | jq '{sentiment, confidence, summary_length: .summary | length}'
else
    echo -e "${RED}✗ First query failed${NC}"
    echo "$response"
    exit 1
fi
echo ""

# Test 3: Second sentiment query (should use cache, NO LLM call)
echo -e "${YELLOW}Test 3: Second Sentiment Query (same token/timeframe)${NC}"
echo "This should return cached result (no DuckDuckGo, no Gemini)..."
response=$(curl -s -X POST http://localhost:8000/api/v1/sentiment \
  -H "Content-Type: application/json" \
  -d '{"token": "BTC", "timeframe": "3d"}')

if echo "$response" | grep -q "sentiment"; then
    echo -e "${GREEN}✓ Cached query successful${NC}"
    echo "Response preview:"
    echo "$response" | jq '{sentiment, confidence, summary_length: .summary | length}'
else
    echo -e "${RED}✗ Cached query failed${NC}"
    echo "$response"
    exit 1
fi
echo ""

# Test 4: Different timeframe (should generate new analysis)
echo -e "${YELLOW}Test 4: Different Timeframe (BTC, 7d)${NC}"
echo "This should use cached articles but generate new sentiment..."
response=$(curl -s -X POST http://localhost:8000/api/v1/sentiment \
  -H "Content-Type: application/json" \
  -d '{"token": "BTC", "timeframe": "7d"}')

if echo "$response" | grep -q "sentiment"; then
    echo -e "${GREEN}✓ Different timeframe query successful${NC}"
    echo "Response preview:"
    echo "$response" | jq '{sentiment, confidence, summary_length: .summary | length}'
else
    echo -e "${RED}✗ Different timeframe query failed${NC}"
    echo "$response"
    exit 1
fi
echo ""

echo "=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=========================================="
echo ""
echo "Check the service logs to verify:"
echo "  - First query: 'Fetched X web results from DuckDuckGo' + 'Gemini summary generated'"
echo "  - Second query: 'Returning cached sentiment result (no LLM call)'"
echo "  - Third query: 'Using X cached articles (no DuckDuckGo call)' + 'Gemini summary generated'"
