#!/usr/bin/env python3
"""
Restore Elasticsearch from CSV backup exported from Kibana
Usage: python restore_es_from_csv.py <csv_file> [--index=media_embeddings]
"""

import argparse
import csv
import json
import os
import sys
from elasticsearch import Elasticsearch
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def parse_embedding(embedding_str):
    """Parse embedding string to list of floats"""
    return [float(x.strip()) for x in embedding_str.split(',')]


def restore_from_csv(csv_file, es_url, es_user, es_pass, index_name):
    print(f"🔄 Restoring from {csv_file} to {es_url}/{index_name}")
    
    # Connect to Elasticsearch
    print("🔌 Connecting to Elasticsearch...")
    es = Elasticsearch(
        es_url,
        basic_auth=(es_user, es_pass),
        verify_certs=False
    )
    
    # Test connection
    if not es.ping():
        print("❌ Cannot connect to Elasticsearch!")
        sys.exit(1)
    print("✅ Connected to Elasticsearch")
    
    # First, create the index with proper mapping
    print("📋 Creating index with mapping...")
    mapping = {
        "mappings": {
            "properties": {
                "embedding": {
                    "type": "dense_vector",
                    "dims": 512,
                    "index": True,
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
    }
    
    # Try to create index (ignore if exists)
    try:
        es.indices.create(index=index_name, body=mapping)
        print("✅ Index created successfully")
    except Exception as e:
        if "resource_already_exists" in str(e):
            print("ℹ️  Index already exists, continuing...")
        else:
            print(f"⚠️  Warning: {e}")
    
    # Read CSV and prepare bulk request
    print("📖 Reading CSV file...")
    bulk_body = []
    doc_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            doc_id = row['_id']
            image_id = row['image_id']
            embedding_str = row['embedding']
            
            # Parse embedding
            try:
                embedding = parse_embedding(embedding_str)
            except Exception as e:
                print(f"⚠️  Skipping document {doc_id}: {e}")
                continue
            
            # Add to bulk request
            # Index action
            bulk_body.append({
                "index": {
                    "_index": index_name,
                    "_id": doc_id
                }
            })
            
            # Document
            bulk_body.append({
                "image_id": image_id,
                "embedding": embedding
            })
            
            doc_count += 1
            
            # Bulk insert every 1000 documents
            if doc_count % 1000 == 0:
                print(f"📤 Uploading batch {doc_count}...")
                
                response = es.bulk(operations=bulk_body, index=index_name)
                
                if response.get("errors"):
                    print(f"⚠️  Some documents in batch failed")
                    # Print first error for debugging
                    for item in response.get("items", []):
                        if "error" in item.get("index", {}):
                            print(f"Error: {item['index']['error']}")
                            break
                
                bulk_body = []
    
    # Upload remaining documents
    if bulk_body:
        print(f"📤 Uploading final batch...")
        
        response = es.bulk(operations=bulk_body, index=index_name)
        
        if response.get("errors"):
            print(f"⚠️  Some documents in final batch failed")
    
    print(f"\n✅ Restore complete! Imported {doc_count} documents")
    
    # Verify count
    count = es.count(index=index_name)["count"]
    print(f"🔍 Verification: Index contains {count} documents")
    
    # Close connection
    es.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Restore Elasticsearch from Kibana CSV export")
    parser.add_argument("csv_file", help="Path to CSV backup file")
    parser.add_argument("--es-url", default=None, help="Elasticsearch URL (default: from .env)")
    parser.add_argument("--es-user", default=None, help="Elasticsearch username (default: from .env)")
    parser.add_argument("--es-pass", default=None, help="Elasticsearch password (default: from .env)")
    parser.add_argument("--index", default="media_embeddings", help="Index name")
    
    args = parser.parse_args()
    
    # Get credentials from env if not provided
    es_url = args.es_url or os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    es_user = args.es_user or os.getenv("ELASTICSEARCH_USER", "elastic")
    es_pass = args.es_pass or os.getenv("ELASTICSEARCH_PASSWORD")
    
    if not es_pass:
        print("❌ Error: Elasticsearch password not found in .env or arguments")
        sys.exit(1)
    
    try:
        restore_from_csv(args.csv_file, es_url, es_user, es_pass, args.index)
    except FileNotFoundError:
        print(f"❌ Error: File '{args.csv_file}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
