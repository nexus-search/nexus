from app.models.image import Image

class ImageRepository:
    async def insert(self, image: Image):
        await image.insert()
        return image

    async def find_all(self):
        return await Image.find_all().to_list()

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
