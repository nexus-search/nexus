import os
from elasticsearch import AsyncElasticsearch
from typing import List

class ESClient:
    def __init__(self):
        es_url = os.getenv("ELASTICSEARCH_URL", "https://localhost:9200")
        es_user = os.getenv("ELASTICSEARCH_USER", "elastic")
        es_pass = os.getenv("ELASTICSEARCH_PASSWORD", "dm_4Moz_XGVWIRHG910C")

        self.es = AsyncElasticsearch(
            es_url,
            basic_auth=(es_user, es_pass),
            verify_certs=False  # optional if you're using self-signed certs
        )

        self.index_name = os.getenv("ELASTICSEARCH_INDEX", "media_embeddings")

    async def create_index(self):
        mapping = {
            "mappings": {
                "properties": {
                    "image_id": {"type": "keyword"},
                    "embedding": {"type": "dense_vector", "dims": 512}
                }
            }
        }
        if not await self.es.indices.exists(index=self.index_name):
            await self.es.indices.create(index=self.index_name, body=mapping)

    async def index_image(self, image_id: str, embedding: List[float]):
        doc = {"image_id": image_id, "embedding": embedding}
        await self.es.index(index=self.index_name, id=image_id, document=doc)
        await self.es.indices.refresh(index=self.index_name)  # <--- important

        

    async def search_similar(self, query_embedding: List[float], top_k: int = 10) -> List[str]:
        query = {
            "size": top_k,
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {"query_vector": query_embedding}
                    }
                }
            }
        }
        response = await self.es.search(index=self.index_name, body=query)
        return [hit["_source"]["image_id"] for hit in response["hits"]["hits"]]

    async def delete_document(self, image_id: str):
        await self.es.delete(index=self.index_name, id=image_id)
