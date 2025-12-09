from beanie import Document
from typing import Optional, List
from sentence_transformers import SentenceTransformer
from PIL import Image

model = SentenceTransformer('clip-ViT-B-32')

class Image(Document):
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None

    class Settings:
        name = "images" # Collection name in the database

    @staticmethod
    def generate_text_embedding(text: str) -> List[float]:
        return model.encode(text).tolist()

    @staticmethod
    def generate_image_embedding(image_path: str) -> List[float]:
        image = Image.open(image_path)
        return model.encode(image).tolist()

    def generate_embedding(self) -> List[float]:
        text = f"{self.title} {self.description or ''}".strip()
        return self.generate_text_embedding(text)
