from beanie import Document
from typing import Optional, List
from PIL import Image as PILImage
from datetime import datetime
from app.services.TextEmbeddings import TextEmbeddings
from app.services.ImageEmbeddings import ImageEmbeddings

# Initialize singleton instances
text_embedder = TextEmbeddings()
image_embedder = ImageEmbeddings()

class Image(Document):
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None

    # Cloudinary fields
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    cloudinary_public_id: Optional[str] = None

    # Metadata fields
    file_size: Optional[int] = None
    visibility: str = "private"  # "public" or "private"
    owner_id: Optional[str] = None
    tags: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Settings:
        name = "images" # Collection name in the database

    @staticmethod
    def generate_text_embedding(text: str) -> List[float]:
        return text_embedder.get_text_embeddings(text)

    @staticmethod
    def generate_image_embedding(image_path: str) -> List[float]:
        image = PILImage.open(image_path).convert("RGB")
        return image_embedder.get_image_embeddings(image)

    def generate_embedding(self) -> List[float]:
        text = f"{self.title} {self.description or ''}".strip()
        return self.generate_text_embedding(text)
