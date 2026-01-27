#!/bin/bash

# Production Startup Script - Docker Compose
# This script starts the chatbot service using Docker Compose

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     AI Chatbot - Production Deployment (Docker)       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${RED}✗ Please edit .env and add your GEMINI_API_KEY${NC}"
    exit 1
fi

# Check if GEMINI_API_KEY is set
source .env
if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo -e "${RED}✗ GEMINI_API_KEY not configured in .env${NC}"
    echo -e "${YELLOW}  Please edit .env and set a valid API key${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo -e "${YELLOW}  Please install Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo -e "${YELLOW}  Please install Docker Compose: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"

# Stop any existing containers
echo -e "\n${BLUE}→ Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Build and start containers
echo -e "${BLUE}→ Building Docker images...${NC}"
docker-compose build

echo -e "\n${BLUE}→ Starting containers...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "\n${BLUE}→ Waiting for services to be ready...${NC}"
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "\n${GREEN}✓ Services started successfully!${NC}\n"
    
    # Show running containers
    echo -e "${BLUE}Running containers:${NC}"
    docker-compose ps
    
    # Show logs command
    echo -e "\n${YELLOW}To view logs:${NC}"
    echo -e "  docker-compose logs -f"
    
    # Show health check
    echo -e "\n${BLUE}→ Testing health endpoint...${NC}"
    sleep 3
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Service is healthy!${NC}"
        echo -e "\n${GREEN}🚀 Chatbot API is running at: http://localhost:8000${NC}"
        echo -e "${GREEN}📊 API Documentation: http://localhost:8000/docs${NC}"
    else
        echo -e "${YELLOW}⚠ Service is starting... (may take a few seconds)${NC}"
    fi
    
    # Stop command
    echo -e "\n${YELLOW}To stop services:${NC}"
    echo -e "  docker-compose down"
    
else
    echo -e "\n${RED}✗ Failed to start services${NC}"
    echo -e "${YELLOW}Check logs with: docker-compose logs${NC}"
    exit 1
fi
