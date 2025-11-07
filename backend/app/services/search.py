from __future__ import annotations

import logging
import time
from typing import Optional

import numpy as np
from elasticsearch import Elasticsearch

from app.config import get_settings
from app.models.database import get_elasticsearch_client
from app.models.media import Media
from app.models.schemas import MediaItem, SearchFilters
from app.models.user import User

logger = logging.getLogger(__name__)
settings = get_settings()


async def search_media(
    query_embedding: np.ndarray,
    user_id: Optional[str],
    scope: str = "all",
    limit: int = 20,
    filters: Optional[SearchFilters] = None,
) -> tuple[list[MediaItem], int, float]:
    """
    Search for similar media using Elasticsearch k-NN.
    
    Returns:
        tuple: (media_items, total_count, search_time_ms)
    """
    start_time = time.time()
    
    es_client = get_elasticsearch_client()
    
    # Convert embedding to list for Elasticsearch
    query_vector = query_embedding.tolist()
    
    # Build Elasticsearch query
    es_query = {
        "knn": {
            "field": "embedding",
            "query_vector": query_vector,
            "k": limit,
            "num_candidates": min(100, limit * 10),  # At least 10x candidates for better recall
        },
        "query": {
            "bool": {
                "filter": []
            }
        },
        "size": limit,
    }
    
    # Scope filtering
    if scope == "all":
        # All: public media OR user's own media
        if user_id:
            es_query["query"]["bool"]["filter"].append({
                "bool": {
                    "should": [
                        {"term": {"visibility": "public"}},
                        {"term": {"owner_id": user_id}}
                    ],
                    "minimum_should_match": 1
                }
            })
        else:
            # No user: only public
            es_query["query"]["bool"]["filter"].append({
                "term": {"visibility": "public"}
            })
    
    elif scope == "my_images":
        # Only user's own media
        if not user_id:
            return [], 0, 0.0
        es_query["query"]["bool"]["filter"].append({
            "term": {"owner_id": user_id}
        })
    
    elif scope == "shared":
        # Only public media
        es_query["query"]["bool"]["filter"].append({
            "term": {"visibility": "public"}
        })
    
    elif scope.startswith("collection:"):
        # Collection scope - get media IDs from collection
        collection_id = scope.split(":")[1]
        from app.models.collection import Collection
        
        collection = Collection.find_by_id(collection_id)
        if not collection:
            logger.warning(f"Collection not found: {collection_id}")
            return [], 0, 0.0
        
        # Check access: public collections or own collections
        if not collection.is_public and (not user_id or str(collection.user_id) != user_id):
            logger.warning(f"User {user_id} tried to access private collection {collection_id}")
            return [], 0, 0.0
        
        # Filter by collection media IDs
        media_ids = collection.get_media_ids()
        if not media_ids:
            return [], 0, 0.0
        
        es_query["query"]["bool"]["filter"].append({
            "terms": {"media_id": media_ids}
        })
    
    # Additional filters
    if filters:
        if filters.content_type:
            es_query["query"]["bool"]["filter"].append({
                "terms": {"content_type": filters.content_type}
            })
        
        if filters.tags:
            es_query["query"]["bool"]["filter"].append({
                "terms": {"tags": filters.tags}
            })
        
        if filters.date_range:
            date_filter = {}
            if filters.date_range.get("start"):
                date_filter["gte"] = filters.date_range["start"]
            if filters.date_range.get("end"):
                date_filter["lte"] = filters.date_range["end"]
            if date_filter:
                es_query["query"]["bool"]["filter"].append({
                    "range": {"upload_date": date_filter}
                })
    
    try:
        # Execute search (ES 8.x uses 'body' parameter)
        response = es_client.search(
            index=settings.elasticsearch_index,
            body=es_query
        )
        
        # Process results
        hits = response.get("hits", {}).get("hits", [])
        total_obj = response.get("hits", {}).get("total", {})
        # Handle both ES 7.x and 8.x response formats
        if isinstance(total_obj, dict):
            total = total_obj.get("value", 0)
        else:
            total = total_obj or 0
        
        media_items = []
        for hit in hits:
            source = hit["_source"]
            score = hit.get("_score", 0.0)
            media_id = source.get("media_id")
            
            if not media_id:
                continue
            
            # Get media from MongoDB for full details
            media = Media.find_by_id(media_id)
            if not media:
                continue
            
            # Build media URL - keep relative, frontend will make it absolute
            media_url = f"/api/v1/media/{media_id}/file"
            thumbnail_url = f"/api/v1/media/{media_id}/file" if media.content_type.startswith("image/") else None
            
            media_type = "image" if media.content_type.startswith("image/") else "video"
            
            media_items.append(
                MediaItem(
                    id=str(media_id),
                    mediaUrl=media_url,
                    thumbnailUrl=thumbnail_url,
                    mediaType=media_type,
                    similarityScore=float(score),
                )
            )
        
        search_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return media_items, total, search_time
    
    except Exception as e:
        logger.error(f"Error searching media: {e}", exc_info=True)
        raise


async def index_media_embedding(
    media_id: str,
    embedding: np.ndarray,
    owner_id: Optional[str],
    visibility: str,
    content_type: str,
    tags: list[str],
    upload_date: str,
) -> None:
    """Index media embedding in Elasticsearch."""
    es_client = get_elasticsearch_client()
    
    try:
        doc = {
            "media_id": media_id,
            "owner_id": str(owner_id) if owner_id else None,
            "visibility": visibility,
            "embedding": embedding.tolist(),
            "content_type": content_type,
            "tags": tags,
            "upload_date": upload_date,
        }
        
        es_client.index(
            index=settings.elasticsearch_index,
            id=media_id,
            document=doc
        )
        
        logger.info(f"Indexed embedding for media: {media_id}")
    
    except Exception as e:
        logger.error(f"Error indexing media embedding: {e}", exc_info=True)
        raise


async def delete_media_embedding(media_id: str) -> None:
    """Delete media embedding from Elasticsearch."""
    es_client = get_elasticsearch_client()
    
    try:
        es_client.delete(
            index=settings.elasticsearch_index,
            id=media_id,
            ignore=[404]  # Ignore if not found
        )
        logger.info(f"Deleted embedding for media: {media_id}")
    except Exception as e:
        logger.error(f"Error deleting media embedding: {e}", exc_info=True)
        # Don't raise - deletion is best effort

