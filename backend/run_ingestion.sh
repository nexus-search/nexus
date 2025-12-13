#!/bin/bash
#
# Complete data ingestion script for Roboflow datasets
# This script runs entirely inside Docker containers
#
# Usage:
#   ./scripts/run_ingestion.sh YOUR_ROBOFLOW_API_KEY
#

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ROBOFLOW_API_KEY="${1}"
WORKSPACE="yuga-pwtql"
PROJECT="animals-eujgm"
VERSION=1
OUTPUT_DIR="./scripts/data/animals"
BATCH_SIZE=10

# Print header
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}       Nexus Search - Data Ingestion Pipeline${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# Check if API key is provided
if [ -z "$ROBOFLOW_API_KEY" ]; then
    echo -e "${RED}Error: Roboflow API key not provided${NC}"
    echo ""
    echo "Usage: $0 YOUR_ROBOFLOW_API_KEY"
    echo ""
    echo "Get your API key from: https://app.roboflow.com/settings/api"
    exit 1
fi

# Step 1: Check if dataset exists on host
echo -e "${YELLOW}[1/4] Checking if dataset exists...${NC}"
if [ ! -d "$OUTPUT_DIR" ] || [ -z "$(ls -A $OUTPUT_DIR 2>/dev/null)" ]; then
    echo -e "${RED}✗ Dataset not found at $OUTPUT_DIR${NC}"
    echo -e "${YELLOW}  Downloading dataset from Roboflow...${NC}"
    
    # Install dependencies in venv if not already installed
    if [ ! -d "scripts/venv" ]; then
        echo -e "${YELLOW}  Creating virtual environment...${NC}"
        python3 -m venv scripts/venv
    fi
    
    source scripts/venv/bin/activate
    pip install -q -r scripts/requirements.txt
    
    python3 scripts/download_roboflow_dataset.py \
        --api-key "$ROBOFLOW_API_KEY" \
        --workspace "$WORKSPACE" \
        --project "$PROJECT" \
        --version "$VERSION" \
        --output-dir "$OUTPUT_DIR"
    
    deactivate
else
    echo -e "${GREEN}✓ Dataset found at $OUTPUT_DIR${NC}"
fi
echo ""

# Step 2: Build and start all services
echo -e "${YELLOW}[2/4] Building and starting Docker services...${NC}"
docker compose up -d --build

echo -e "${YELLOW}  Waiting for services to be ready...${NC}"
sleep 15

# Check MongoDB
if ! nc -z localhost 27017 2>/dev/null; then
    echo -e "${RED}✗ MongoDB is not running${NC}"
    echo -e "${YELLOW}  Waiting longer for MongoDB...${NC}"
    sleep 5
fi
echo -e "${GREEN}✓ MongoDB is running${NC}"

# Check Elasticsearch
if ! nc -z localhost 9200 2>/dev/null; then
    echo -e "${RED}✗ Elasticsearch is not running${NC}"
    echo -e "${YELLOW}  Waiting longer for Elasticsearch...${NC}"
    sleep 5
fi
echo -e "${GREEN}✓ Elasticsearch is running${NC}"

# Check Backend
if ! docker compose ps backend | grep -q "Up"; then
    echo -e "${RED}✗ Backend container is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Step 3: Run ingestion pipeline inside Docker
echo -e "${YELLOW}[3/4] Running ingestion pipeline inside Docker container...${NC}"
docker compose exec backend python scripts/data_ingestion_pipeline.py \
    --dataset-path "$OUTPUT_DIR" \
    --user-id "system" \
    --batch-size "$BATCH_SIZE"

echo ""
# Step 4: Summary
echo -e "${YELLOW}[4/4] Ingestion Summary${NC}"
docker compose exec backend python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def get_stats():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    
    images_count = await db.images.count_documents({})
    collections_count = await db.collections.count_documents({})
    
    print(f'  Images in database: {images_count}')
    print(f'  Collections: {collections_count}')
    
    client.close()

asyncio.run(get_stats())
"

echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}       Data Ingestion Complete!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""
echo "You can now:"
echo "  • Start the backend: python -m uvicorn app.main:app --reload"
echo "  • Test search: curl http://localhost:8000/api/v1/use/search/text?query=cat"
echo "  • View images: http://localhost:8000/api/v1/media"
echo ""
