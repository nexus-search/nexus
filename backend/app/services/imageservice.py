from app.models.image import Image
from app.repositories.imagerepository import ImageRepository
from app.elasticsearch.client import ESClient

class ImageService:
    def __init__(self):
        self.repo = ImageRepository()
        self.es_client = ESClient()

    async def create_image(self, title: str, description: str, file_path: str):
        img = Image(title=title, description=description, file_path=file_path)
        inserted_img = await self.repo.insert(img)
        embedding = inserted_img.generate_embedding()
        await self.es_client.index_image(str(inserted_img.id), embedding)
        return inserted_img


    async def get_all_images(self, page: int = 1, limit: int = 10):
        return await self.repo.find_all(page, limit)


    async def get_image_by_id(self, id: str):
        return await self.repo.find_by_id(id)

    async def update_image(self, image: Image):
        return await self.repo.update(image)

    async def delete_image(self, id: str):
        return await self.repo.delete(id)
