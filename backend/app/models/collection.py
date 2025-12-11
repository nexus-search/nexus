from beanie import Document
from typing import Optional
from datetime import datetime
from app.models.image import Image

class Collection(Document):
    name: str
    description: Optional[str] = None
    images: Optional[list[Image]] = []
    private: Optional[bool] = False
    cover_image_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Settings:
        name = "collections"  # Collection name in the database