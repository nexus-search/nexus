import pytest
from app.services.collectionservice import CollectionService
from app.persistance.db import init_db

@pytest.mark.asyncio
async def test_create_collection():
    await init_db()
    service = CollectionService()
    collection = await service.create_collection("Test Collection", "A test collection", private=False)
    assert collection.name == "Test Collection"
    assert collection.description == "A test collection"
    assert collection.private == False
    # Cleanup
    await service.delete_collection(str(collection.id))

@pytest.mark.asyncio
async def test_get_all_collections():
    await init_db()
    service = CollectionService()
    # Create a couple of collections
    col1 = await service.create_collection("Collection 1", "First collection")
    col2 = await service.create_collection("Collection 2", "Second collection")
    
    collections = await service.get_all_collections(page=1, limit=20)
    # Check if our collections are in the list
    names = [c.name for c in collections]
    assert "Collection 1" in names
    assert "Collection 2" in names
    
    # Cleanup
    await service.delete_collection(str(col1.id))
    await service.delete_collection(str(col2.id))


@pytest.mark.asyncio
async def test_get_collection_by_id():
    await init_db()
    service = CollectionService()
    # Create a collection
    collection = await service.create_collection("Unique Collection", "For ID test")
    
    # Get by ID
    retrieved = await service.get_collection_by_id(str(collection.id))
    assert retrieved is not None
    assert retrieved.name == "Unique Collection"
    assert retrieved.description == "For ID test"
    
    # Cleanup
    await service.delete_collection(str(collection.id))
