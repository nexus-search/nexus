from app.models.collection import Collection

class CollectionRepository:
    async def insert(self, collection: Collection):
        await collection.insert()
        return collection

    async def find_all(self):
        return await Collection.find_all().to_list()

    async def find_by_id(self, id: str):
        return await Collection.get(id)

    async def update(self, collection: Collection):
        await collection.save()
        return collection

    async def delete(self, id: str):
        collection = await self.find_by_id(id)
        if collection:
            await collection.delete()
        return collection
