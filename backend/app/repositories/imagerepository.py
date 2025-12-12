from app.models.image import Image

class ImageRepository:
    async def insert(self, image: Image):
        await image.insert()
        return image

    async def find_all(self, page: int = 1, limit: int = 10):
        skip = (page - 1) * limit
        return await Image.find_all().skip(skip).limit(limit).to_list()

    async def find_public(self, page: int = 1, limit: int = 20):
        """Find all public images with pagination."""
        skip = (page - 1) * limit
        return await Image.find({"visibility": "public"}).skip(skip).limit(limit).to_list()

    async def count_public(self):
        """Count total public images."""
        return await Image.find({"visibility": "public"}).count()

    async def find_by_id(self, id: str):
        return await Image.get(id)

    async def update(self, image: Image):
        await image.save()
        return image

    async def delete(self, id: str):
        image = await self.find_by_id(id)
        if image:
            await image.delete()
        return image
