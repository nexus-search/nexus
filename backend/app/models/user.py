from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

from app.config import get_settings
from app.models.database import get_mongo_client


def get_users_collection():
    """Get the users collection from MongoDB."""
    client = get_mongo_client()
    settings = get_settings()
    return client[settings.mongodb_db]["users"]


def create_user_indexes():
    """Create indexes for the users collection."""
    collection = get_users_collection()
    collection.create_index("email", unique=True)
    collection.create_index("username", unique=True)


class User:
    """User model for MongoDB."""

    def __init__(
        self,
        email: str,
        username: str,
        password_hash: str,
        user_id: Optional[ObjectId] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        storage_quota: Optional[int] = None,
        storage_used: int = 0,
        is_active: bool = True,
        role: str = "user",
    ):
        self._id = user_id
        self.email = email
        self.username = username
        self.password_hash = password_hash
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        settings = get_settings()
        self.storage_quota = storage_quota or (settings.default_user_quota_gb * 1024 * 1024 * 1024)
        self.storage_used = storage_used
        self.is_active = is_active
        self.role = role

    def to_dict(self) -> dict:
        """Convert user to dictionary for MongoDB."""
        data = {
            "email": self.email,
            "username": self.username,
            "password_hash": self.password_hash,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "storage_quota": self.storage_quota,
            "storage_used": self.storage_used,
            "is_active": self.is_active,
            "role": self.role,
        }
        if self._id:
            data["_id"] = self._id
        return data

    @classmethod
    def from_dict(cls, data: dict) -> User:
        """Create user from MongoDB document."""
        return cls(
            user_id=data.get("_id"),
            email=data["email"],
            username=data["username"],
            password_hash=data["password_hash"],
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            storage_quota=data.get("storage_quota"),
            storage_used=data.get("storage_used", 0),
            is_active=data.get("is_active", True),
            role=data.get("role", "user"),
        )

    def save(self) -> ObjectId:
        """Save user to MongoDB."""
        collection = get_users_collection()
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
    def find_by_email(cls, email: str) -> Optional[User]:
        """Find user by email."""
        collection = get_users_collection()
        doc = collection.find_one({"email": email})
        if doc:
            return cls.from_dict(doc)
        return None

    @classmethod
    def find_by_username(cls, username: str) -> Optional[User]:
        """Find user by username."""
        collection = get_users_collection()
        doc = collection.find_one({"username": username})
        if doc:
            return cls.from_dict(doc)
        return None

    @classmethod
    def find_by_id(cls, user_id: ObjectId | str) -> Optional[User]:
        """Find user by ID."""
        collection = get_users_collection()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        doc = collection.find_one({"_id": user_id})
        if doc:
            return cls.from_dict(doc)
        return None

    def update_storage_used(self, bytes_used: int) -> None:
        """Update storage used by user."""
        collection = get_users_collection()
        self.storage_used = bytes_used
        collection.update_one(
            {"_id": self._id},
            {"$set": {"storage_used": bytes_used, "updated_at": datetime.utcnow()}},
        )

