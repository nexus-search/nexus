#!/bin/bash
# Restore MongoDB and Elasticsearch data on EC2 cloud instance

if [ -z "$1" ]; then
  echo "Usage: ./restore_cloud.sh <backup_archive.tar.gz>"
  exit 1
fi

BACKUP_ARCHIVE="$1"
RESTORE_DIR="./restore_temp"

echo "📦 Extracting backup archive..."
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_ARCHIVE" -C "$RESTORE_DIR"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Set defaults if not in .env
MONGO_USER=${MONGO_INITDB_ROOT_USERNAME:-admin}
MONGO_PASS=${MONGO_INITDB_ROOT_PASSWORD:-changeme}
MONGO_DB=${MONGODB_DB:-mydatabase}
ES_INDEX=${ELASTICSEARCH_INDEX:-media_embeddings}

# Restore MongoDB
if [ -f "$RESTORE_DIR/mongodb_backup.archive.gz" ]; then
  echo "🔄 Restoring MongoDB to database: $MONGO_DB..."
  
  # Copy backup into container
  docker compose cp "$RESTORE_DIR/mongodb_backup.archive.gz" mongodb://data//backup.archive.gz
  
  # Restore from archive
  docker compose exec -T mongodb mongorestore \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --authenticationDatabase=admin \
    --archive=//data//backup.archive.gz \
    --gzip \
    --drop
  
  echo "✅ MongoDB restored successfully"
else
  echo "⚠️  MongoDB backup file not found"
fi

# Restore Elasticsearch
if [ -f "$RESTORE_DIR/es_media_embeddings.json" ]; then
  echo "🔄 Restoring Elasticsearch to index: $ES_INDEX..."
  
  # Install requests if not available
  pip install requests &>/dev/null || python -m pip install requests &>/dev/null
  
  # Create index if it doesn't exist
  curl -X PUT "http://localhost:9200/$ES_INDEX" \
    -H "Content-Type: application/json" \
    -d '{
      "mappings": {
        "properties": {
          "embedding": {
            "type": "dense_vector",
            "dims": 512,
            "index": true,
            "similarity": "cosine",
            "index_options": {
              "type": "bbq_hnsw",
              "m": 16,
              "ef_construction": 100,
              "rescore_vector": {
                "oversample": 3.0
              }
            }
          },
          "image_id": {
            "type": "keyword"
          }
        }
      }
    }'
  
  # Bulk import documents
  python3 - "$ES_INDEX" << 'EOF'
import json
import requests
import sys
from pathlib import Path

index_name = sys.argv[1] if len(sys.argv) > 1 else "media_embeddings"
restore_file = "./restore_temp/es_media_embeddings.json"

with open(restore_file, "r") as f:
    docs = json.load(f)

# Prepare bulk request
bulk_body = []
for doc in docs:
    # Index action
    bulk_body.append(json.dumps({"index": {"_index": index_name, "_id": doc["_id"]}}))
    # Document
    bulk_body.append(json.dumps(doc["_source"]))

bulk_data = "\n".join(bulk_body) + "\n"

# Send bulk request
response = requests.post(
    "http://localhost:9200/_bulk",
    headers={"Content-Type": "application/x-ndjson"},
    data=bulk_data
)

result = response.json()
if result.get("errors"):
    print(f"⚠️  Some documents failed to import")
else:
    print(f"✅ Imported {len(docs)} documents successfully")
EOF

  echo "✅ Elasticsearch restored successfully"
else
  echo "⚠️  Elasticsearch backup file not found"
fi

# Cleanup
echo "🧹 Cleaning up temporary files..."
rm -rf "$RESTORE_DIR"

echo ""
echo "✅ Restore complete!"
echo "🔍 Verify data:"
echo "  MongoDB: docker compose exec mongodb mongosh -u $MONGO_USER -p $MONGO_PASS --authenticationDatabase admin"
echo "  Elasticsearch: curl http://localhost:9200/$ES_INDEX/_count"
echo "  Redis: docker compose exec redis redis-cli ping"
