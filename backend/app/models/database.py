from __future__ import annotations

import logging
from typing import Optional, Tuple

import gridfs
from elasticsearch import Elasticsearch
from elasticsearch import exceptions as es_exceptions
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.config import get_settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[MongoClient] = None
_grid_fs: Optional[gridfs.GridFS] = None
_es_client: Optional[Elasticsearch] = None


def init_clients() -> None:
    """Initialise MongoDB GridFS and Elasticsearch clients."""

    global _mongo_client, _grid_fs, _es_client
    settings = get_settings()

    if _mongo_client is None:
        _mongo_client = MongoClient(settings.mongodb_url)
        _grid_fs = gridfs.GridFS(_mongo_client[settings.mongodb_db])
        logger.info("MongoDB client connected to %s", settings.mongodb_url)

    if _es_client is None:
        auth: Optional[Tuple[str, str]] = None
        if settings.elasticsearch_username and settings.elasticsearch_password:
            auth = (settings.elasticsearch_username, settings.elasticsearch_password)

        _es_client = Elasticsearch(settings.elasticsearch_url, basic_auth=auth)
        logger.info("Elasticsearch client initialised (%s)", settings.elasticsearch_url)


def close_clients() -> None:
    """Close database clients."""

    global _mongo_client, _grid_fs, _es_client

    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
        _grid_fs = None

    if _es_client is not None:
        try:
            _es_client.close()
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to close Elasticsearch client: %s", exc)
        finally:
            _es_client = None


def get_mongo_client() -> MongoClient:
    if _mongo_client is None:
        init_clients()
    assert _mongo_client is not None  # for type checkers
    return _mongo_client


def get_gridfs_bucket() -> gridfs.GridFS:
    if _grid_fs is None:
        init_clients()
    assert _grid_fs is not None
    return _grid_fs


def get_elasticsearch_client() -> Elasticsearch:
    if _es_client is None:
        init_clients()
    assert _es_client is not None
    return _es_client


def ping_mongodb() -> Tuple[bool, str]:
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        return True, "ok"
    except PyMongoError as exc:
        logger.error("MongoDB ping failed: %s", exc)
        return False, str(exc)


def ping_elasticsearch() -> Tuple[bool, str]:
    try:
        client = get_elasticsearch_client()
        if client.ping():
            return True, "ok"
        return False, "ping failed"
    except es_exceptions.ElasticsearchException as exc:
        logger.error("Elasticsearch ping failed: %s", exc)
        return False, str(exc)

