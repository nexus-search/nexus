from app.models.collection import Collection
from app.repositories.collectionrepository import CollectionRepository

class CollectionService:
    def __init__(self):
        self.repo = CollectionRepository()

    async def create_collection(self, name: str, description: str = None, private: bool = False):
        collection = Collection(name=name, description=description, private=private)
        return await self.repo.insert(collection)

    async def get_all_collections(self, page: int = 1, limit: int = 10):
        return await self.repo.find_all(page, limit)

    async def get_collection_by_id(self, id: str):
        return await self.repo.find_by_id(id)

    async def update_collection(self, collection: Collection):
        return await self.repo.update(collection)

    async def delete_collection(self, id: str):
        return await self.repo.delete(id)
    
    async def add_collection_to_user(self, user, collection: Collection):
        if not user.collections:
            user.collections = []
        user.collections.append(collection)
        await user.save()
