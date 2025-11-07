from __future__ import annotations

import logging
from typing import Any, Dict

from elasticsearch import Elasticsearch
from elasticsearch import exceptions as es_exceptions


logger = logging.getLogger(__name__)

MEDIA_INDEX_MAPPING: Dict[str, Any] = {
    "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 1,
    },
    "mappings": {
        "properties": {
            "media_id": {"type": "keyword"},
            "owner_id": {"type": "keyword"},  # null for public/shared media
            "visibility": {"type": "keyword"},  # "public" or "private"
            "embedding": {
                "type": "dense_vector",
                "dims": 512,
                "index": True,
                "similarity": "cosine",
            },
            "content_type": {"type": "keyword"},
            "tags": {"type": "keyword"},
            "upload_date": {"type": "date"},
            "filename": {"type": "text"},
            "metadata": {"type": "object"},
        }
    }
}


def ensure_media_index(client: Elasticsearch, index_name: str) -> None:
    """Create the media embeddings index if it doesn't exist."""

    try:
        if client.indices.exists(index=index_name):
            return
        client.indices.create(index=index_name, **MEDIA_INDEX_MAPPING)
        logger.info("Created Elasticsearch index '%s'", index_name)
    except es_exceptions.RequestError as exc:
        if exc.error == "resource_already_exists_exception":
            logger.debug("Elasticsearch index '%s' already exists", index_name)
            return
        logger.error("Failed to create Elasticsearch index '%s': %s", index_name, exc)
        raise

