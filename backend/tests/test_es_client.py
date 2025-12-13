import pytest

from app.elasticsearch.client import ESClient


@pytest.mark.asyncio
async def test_es_connection():
    client = ESClient()
    info = await client.es.info()
    assert info['cluster_name'] is not None
    print("Elasticsearch connection successful")

@pytest.mark.asyncio
async def test_create_index():
    client = ESClient()
    await client.create_index()
    exists = await client.es.indices.exists(index=client.index_name)
    assert exists
    print("Index created successfully")

@pytest.mark.asyncio
async def test_index_and_search():
    client = ESClient()
    test_id = "test_image_123"
    test_embedding = [0.1] * 512  # Mock 512-dim vector
    await client.index_image(test_id, test_embedding)
    
    # Search for similar
    results = await client.search_similar(test_embedding, top_k=5)
    assert test_id in results
    print("Indexing and search successful")

    # Cleanup
    await client.delete_document(test_id)
