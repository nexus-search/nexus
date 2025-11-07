from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import MongoClient

from app.config import get_settings
from app.models.database import get_mongo_client


def get_collections_collection():
    """Get the collections collection from MongoDB."""
    client = get_mongo_client()
    settings = get_settings()
    return client[settings.mongodb_db]["collections"]


class Collection:
    """Collection model for MongoDB."""

    def __init__(
        self,
        user_id: ObjectId,
        name: str,
        collection_id: Optional[ObjectId] = None,
        description: Optional[str] = None,
        media_ids: Optional[list[ObjectId]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        is_public: bool = False,
    ):
        self._id = collection_id
        self.user_id = user_id
        self.name = name
        self.description = description or ""
        self.media_ids = media_ids or []
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self.is_public = is_public

    def to_dict(self) -> dict:
        """Convert collection to dictionary for MongoDB."""
        data = {
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "media_ids": self.media_ids,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_public": self.is_public,
        }
        if self._id:
            data["_id"] = self._id
        return data

    @classmethod
    def from_dict(cls, data: dict) -> Collection:
        """Create collection from MongoDB document."""
        return cls(
            collection_id=data.get("_id"),
            user_id=data["user_id"],
            name=data["name"],
            description=data.get("description", ""),
            media_ids=data.get("media_ids", []),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            is_public=data.get("is_public", False),
        )

    def save(self) -> ObjectId:
        """Save collection to MongoDB."""
        collection = get_collections_collection()
        self.updated_at = datetime.utcnow()
        data = self.to_dict()
        
        if self._id:
            collection.update_one({"_id": self._id}, {"$set": data})
            return self._id
        else:
            result = collection.insert_one(data)
            self._id = result.inserted_id
            return self._id

    @classmethod
    def find_by_id(cls, collection_id: ObjectId | str) -> Optional[Collection]:
        """Find collection by ID."""
        collection = get_collections_collection()
        if isinstance(collection_id, str):
            try:
                collection_id = ObjectId(collection_id)
            except Exception:
                return None
        doc = collection.find_one({"_id": collection_id})
        if doc:
            return cls.from_dict(doc)
        return None

    @classmethod
    def find_by_user(cls, user_id: ObjectId | str, limit: int = 100) -> list[Collection]:
        """Find all collections owned by a user."""
        collection = get_collections_collection()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        docs = collection.find({"user_id": user_id}).limit(limit).sort("created_at", -1)
        return [cls.from_dict(doc) for doc in docs]

    @classmethod
    def find_public(cls, limit: int = 100) -> list[Collection]:
        """Find all public collections."""
        collection = get_collections_collection()
        docs = collection.find({"is_public": True}).limit(limit).sort("created_at", -1)
        return [cls.from_dict(doc) for doc in docs]

    def add_media(self, media_id: ObjectId | str) -> bool:
        """Add media to collection."""
        if isinstance(media_id, str):
            try:
                media_id = ObjectId(media_id)
            except Exception:
                return False
        
        if media_id not in self.media_ids:
            self.media_ids.append(media_id)
            collection = get_collections_collection()
            collection.update_one(
                {"_id": self._id},
                {
                    "$addToSet": {"media_ids": media_id},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return True
        return False

    def remove_media(self, media_id: ObjectId | str) -> bool:
        """Remove media from collection."""
        if isinstance(media_id, str):
            try:
                media_id = ObjectId(media_id)
            except Exception:
                return False
        
        if media_id in self.media_ids:
            self.media_ids.remove(media_id)
            collection = get_collections_collection()
            collection.update_one(
                {"_id": self._id},
                {
                    "$pull": {"media_ids": media_id},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return True
        return False

    def delete(self) -> bool:
        """Delete collection from MongoDB."""
        if not self._id:
            return False
        collection = get_collections_collection()
        result = collection.delete_one({"_id": self._id})
        return result.deleted_count > 0

    def get_media_ids(self) -> list[str]:
        """Get list of media IDs as strings."""
        return [str(mid) for mid in self.media_ids]

