#!/bin/bash
# Backup local MongoDB and Elasticsearch data

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in $BACKUP_DIR"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Set defaults if not in .env
MONGO_USER=${MONGO_INITDB_ROOT_USERNAME:-admin}
MONGO_PASS=${MONGO_INITDB_ROOT_PASSWORD:-changeme}
MONGO_DB=${MONGODB_DB:-mydatabase}
ES_INDEX=${ELASTICSEARCH_INDEX:-media_embeddings}

# Backup MongoDB
echo "🔄 Backing up MongoDB (DB: $MONGO_DB)..."
docker compose exec -T mongodb mongodump \
  --username=$MONGO_USER \
  --password=$MONGO_PASS \
  --authenticationDatabase=admin \
  --db=$MONGO_DB \
  --archive=//data//backup.archive \
  --gzip

docker compose cp mongodb://data//backup.archive "$BACKUP_DIR/mongodb_backup.archive.gz"
echo "✅ MongoDB backup saved to $BACKUP_DIR/mongodb_backup.archive.gz"

# Backup Elasticsearch
echo "🔄 Backing up Elasticsearch..."

# Install requests if not available (for local Python environment)
pip install requests &>/dev/null || python -m pip install requests &>/dev/null

# Get all documents using scroll API
python3 - "$BACKUP_DIR" << 'EOF'
import json
import requests
import sys
from pathlib import Path

backup_dir = sys.argv[1] if len(sys.argv) > 1 else "./backups/latest"
output_file = f"{backup_dir}/es_media_embeddings.json"

# Initial search
response = requests.get("http://localhost:9200/media_embeddings/_search?scroll=5m&size=1000")
data = response.json()

all_docs = []
scroll_id = data.get("_scroll_id")
hits = data.get("hits", {}).get("hits", [])
all_docs.extend(hits)

print(f"Initial batch: {len(hits)} documents")

# Continue scrolling
while hits:
    response = requests.post(
        "http://localhost:9200/_search/scroll",
        json={"scroll": "5m", "scroll_id": scroll_id}
    )
    data = response.json()
    scroll_id = data.get("_scroll_id")
    hits = data.get("hits", {}).get("hits", [])
    all_docs.extend(hits)
    if hits:
        print(f"Fetched {len(hits)} more documents. Total: {len(all_docs)}")

# Save to file
with open(output_file, "w") as f:
    json.dump(all_docs, f)

print(f"✅ Saved {len(all_docs)} documents to {output_file}")

# Clear scroll
if scroll_id:
    requests.delete(f"http://localhost:9200/_search/scroll/{scroll_id}")
EOF

echo "✅ Elasticsearch backup saved to $BACKUP_DIR/es_media_embeddings.json"

# Create archive
echo "🔄 Creating compressed archive..."
tar -czf "backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$BACKUP_DIR" .
echo "✅ Backup complete! Archive: backup_$(date +%Y%m%d_%H%M%S).tar.gz"

echo ""
echo "📤 To transfer to EC2, run:"
echo "scp backup_*.tar.gz user@ec2-instance:/path/to/nexus/backend/"
