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
                    "filename": img.title or "Untitled",
                    "title": img.title,
                    "description": img.description,
                    "mediaUrl": img.file_path or "",
                    "thumbnailUrl": img.thumbnail_url or img.file_path or "",
                    "mediaType": "image",
                    "fileSize": img.file_size or 0,
                    "uploadDate": img.created_at.isoformat() if img.created_at else "",
                    "tags": img.tags or [],
                    "visibility": img.visibility or "public",
                    "ownerId": str(img.owner_id) if img.owner_id else ""
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
                        "filename": img.title or "Untitled",
                        "title": img.title,
                        "description": img.description,
                        "mediaUrl": img.file_path or "",
                        "thumbnailUrl": img.thumbnail_url or img.file_path or "",
                        "mediaType": "image",
                        "fileSize": img.file_size or 0,
                        "uploadDate": img.created_at.isoformat() if img.created_at else "",
                        "tags": img.tags or [],
                        "visibility": img.visibility or "public",
                        "ownerId": str(img.owner_id) if img.owner_id else ""
                    })
            return images
        finally:
            os.unlink(temp_path)

    async def search_by_media_id(self, media_id: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Find similar media items by using the embedding of an existing media item.

        Args:
            media_id: The ID of the media item to find similar items for
            top_k: Number of similar items to return

        Returns:
            List of similar media items with metadata
        """
        # Get the source media item
        source_image = await self.repo.find_by_id(media_id)
        if not source_image:
            return []

        # Get the embedding from Elasticsearch or regenerate it
        # For now, we'll regenerate it from the source text
        # In production, you might want to store embeddings in MongoDB or retrieve from ES
        query_embedding = source_image.generate_embedding()

        # Search for similar images
        image_ids = await self.es_client.search_similar(query_embedding, top_k + 1)

        images = []
        for img_id in image_ids:
            # Skip the source image itself
            if img_id == media_id:
                continue

            img = await self.repo.find_by_id(img_id)
            if img:
                images.append({
                    "id": str(img.id),
                    "filename": img.title or "Untitled",
                    "title": img.title,
                    "description": img.description,
                    "mediaUrl": img.file_path or "",
                    "thumbnailUrl": img.thumbnail_url or img.file_path or "",
                    "mediaType": "image",
                    "fileSize": img.file_size or 0,
                    "uploadDate": img.created_at.isoformat() if img.created_at else "",
                    "tags": img.tags or [],
                    "visibility": img.visibility or "public",
                    "ownerId": str(img.owner_id) if img.owner_id else ""
                })

            # Stop once we have enough results (excluding the source)
            if len(images) >= top_k:
                break

        return images
