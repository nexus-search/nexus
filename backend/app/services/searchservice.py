from app.models.image import Image
from app.repositories.imagerepository import ImageRepository
from app.elasticsearch.client import ESClient
from typing import List, Dict, Any
import tempfile
import os

class SearchService:
    def __init__(self):
        self.repo = ImageRepository()
        self.es_client = ESClient()

    async def search_by_text(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        query_embedding = Image.generate_text_embedding(query)
        image_ids = await self.es_client.search_similar(query_embedding, top_k)
        images = []
        for img_id in image_ids:
            img = await self.repo.find_by_id(img_id)
            if img:
                images.append({
                    "id": str(img.id),
                    "title": img.title,
                    "description": img.description,
                    "file_path": img.file_path
                })
        return images

    async def search_by_image(self, image_file: bytes, top_k: int = 10) -> List[Dict[str, Any]]:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
            temp_file.write(image_file)
            temp_path = temp_file.name
        try:
            query_embedding = Image.generate_image_embedding(temp_path)
            image_ids = await self.es_client.search_similar(query_embedding, top_k)
            images = []
            for img_id in image_ids:
                img = await self.repo.find_by_id(img_id)
                if img:
                    images.append({
                        "id": str(img.id),
                        "title": img.title,
                        "description": img.description,
                        "file_path": img.file_path
                    })
            return images
        finally:
            os.unlink(temp_path)
