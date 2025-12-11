from app.global_config import config as Config
from app.services.ImageEmbeddings import ImageEmbeddings
from app.elasticsearch.client import ESClient
from os.path import basename,join
from os import listdir
import requests

async def helper(images_links,image_embedder,es_client):
    embedding = image_embedder.processImages(images_links)
    images = [{
                "image_id" : basename(image_path),
                "embedding": image_embeddings.cpu().numpy().tolist()
              } for image_path, image_embeddings in zip(images_links, embedding)]
    
    for image in images:
        print(f"Indexing : {image['image_id']}, length: {len(image['embedding'])},values: {image['embedding'][:5]}")
    await es_client.bulk_index_images(images)

async def populateElasticSearch(links:list[str], batch_size:int=32):
    image_embedder = ImageEmbeddings(Config.DEFAULT_CLIP_MODEL)
    es_client = ESClient()
    for i in range(0, len(links), batch_size):
        images_links = links[i:i + batch_size]
        await helper(images_links,image_embedder,es_client)

def get_image_links_from_folder(folder_path: str) -> list[str]:
    supported_extensions = ('.png', '.jpg', '.jpeg', '.bmp', '.gif')
    return [join(folder_path, f) for f in listdir(folder_path) if f.lower().endswith(supported_extensions)]
def get_image_links_from_file(file_path: str) -> list[str]:
    with open(file_path, 'r') as f:
        links = [line.strip() for line in f if line.strip()]
    return links
def get_image_links_from_url(url: list[str]) -> list[str]:
    urls = requests.get(url).text.splitlines()
    return urls

if __name__ == "__main__":
    import os; print("Executed from :", os.getcwd())
    import asyncio
    # Example usage
    links = ['https://media.istockphoto.com/id/538335769/fr/photo/beignet-avec-confettis-en-sucre-isol%C3%A9.jpg?s=612x612&w=0&k=20&c=5ABjKAsyFwFNflL6BhabjmsRod2X5ZZVMBpohEjh304=']
    asyncio.run(populateElasticSearch(links, 32))

    print(f"Finished processing {len(links)} images.")