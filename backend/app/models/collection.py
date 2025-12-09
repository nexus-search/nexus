from beanie import Document
from typing import Optional
from app.models.image import Image

class Collection(Document):
    name: str
    description: Optional[str] = None
    images: Optional[list[Image]] = []
    private: Optional[bool] = False

    class Settings:
        name = "collections"  # Collection name in the database