from app.models.image import Image
from app.repositories.imagerepository import ImageRepository

class ImageService:
    def __init__(self):
        self.repo = ImageRepository()

    async def create_image(self, title: str, description: str, file_path: str):
        img = Image(title=title, description=description, file_path=file_path)
        return await self.repo.insert(img)

    async def get_all_images(self):
        return await self.repo.find_all()

    async def get_image_by_id(self, id: str):
        return await self.repo.find_by_id(id)

    async def update_image(self, image: Image):
        return await self.repo.update(image)

    async def delete_image(self, id: str):
        return await self.repo.delete(id)
