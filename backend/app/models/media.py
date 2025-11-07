from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import MongoClient

from app.config import get_settings
from app.models.database import get_mongo_client


def get_media_collection():
    """Get the media collection from MongoDB."""
    client = get_mongo_client()
    settings = get_settings()
    return client[settings.mongodb_db]["media"]


class Media:
    """Media model for MongoDB."""

    def __init__(
        self,
        filename: str,
        content_type: str,
        file_size: int,
        gridfs_id: ObjectId,
        owner_id: Optional[ObjectId] = None,
        visibility: str = "private",
        media_id: Optional[ObjectId] = None,
        upload_date: Optional[datetime] = None,
        metadata: Optional[dict] = None,
        tags: Optional[list[str]] = None,
        embedding_indexed: bool = False,
    ):
        self._id = media_id
        self.filename = filename
        self.content_type = content_type
        self.file_size = file_size
        self.gridfs_id = gridfs_id
        self.owner_id = owner_id
        self.visibility = visibility
        self.upload_date = upload_date or datetime.utcnow()
        self.metadata = metadata or {}
        self.tags = tags or []
        self.embedding_indexed = embedding_indexed

    def to_dict(self) -> dict:
        """Convert media to dictionary for MongoDB."""
        data = {
            "filename": self.filename,
            "content_type": self.content_type,
            "file_size": self.file_size,
            "gridfs_id": self.gridfs_id,
            "owner_id": self.owner_id,
            "visibility": self.visibility,
            "upload_date": self.upload_date,
            "metadata": self.metadata,
            "tags": self.tags,
            "embedding_indexed": self.embedding_indexed,
        }
        if self._id:
            data["_id"] = self._id
        return data

    @classmethod
    def from_dict(cls, data: dict) -> Media:
        """Create media from MongoDB document."""
        return cls(
            media_id=data.get("_id"),
            filename=data["filename"],
            content_type=data["content_type"],
            file_size=data["file_size"],
            gridfs_id=data["gridfs_id"],
            owner_id=data.get("owner_id"),
            visibility=data.get("visibility", "private"),
            upload_date=data.get("upload_date"),
            metadata=data.get("metadata", {}),
            tags=data.get("tags", []),
            embedding_indexed=data.get("embedding_indexed", False),
        )

    def save(self) -> ObjectId:
        """Save media to MongoDB."""
        collection = get_media_collection()
        data = self.to_dict()
        
        if self._id:
            collection.update_one({"_id": self._id}, {"$set": data})
            return self._id
        else:
            result = collection.insert_one(data)
            self._id = result.inserted_id
            return self._id

    @classmethod
    def find_by_id(cls, media_id: ObjectId | str) -> Optional[Media]:
        """Find media by ID."""
        collection = get_media_collection()
        if isinstance(media_id, str):
            try:
                media_id = ObjectId(media_id)
            except Exception:
                return None
        doc = collection.find_one({"_id": media_id})
        if doc:
            return cls.from_dict(doc)
        return None

    @classmethod
    def find_by_owner(cls, owner_id: ObjectId | str, limit: int = 100) -> list[Media]:
        """Find all media owned by a user."""
        collection = get_media_collection()
        if isinstance(owner_id, str):
            owner_id = ObjectId(owner_id)
        docs = collection.find({"owner_id": owner_id}).limit(limit).sort("upload_date", -1)
        return [cls.from_dict(doc) for doc in docs]

    @classmethod
    def find_public(cls, limit: int = 100) -> list[Media]:
        """Find all public media."""
        collection = get_media_collection()
        docs = collection.find({"visibility": "public"}).limit(limit).sort("upload_date", -1)
        return [cls.from_dict(doc) for doc in docs]

    def delete(self) -> bool:
        """Delete media from MongoDB."""
        if not self._id:
            return False
        collection = get_media_collection()
        result = collection.delete_one({"_id": self._id})
        return result.deleted_count > 0

