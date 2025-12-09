from fastapi import APIRouter, Depends, UploadFile, File
from app.util.current_user import get_current_user
from app.services.collectionservice import CollectionService
from app.services.searchservice import SearchService
from app.models.image import Image
from app.services.imageservice import ImageService

router = APIRouter(prefix="/use", tags=["use"])
coll_service = CollectionService()
search_service = SearchService()
image_service = ImageService()


@router.get("/profile")
async def profile(current_user=Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "username": current_user.username}

@router.get("/collections")
async def get_collections(current_user=Depends(get_current_user)):
    return {"collections": current_user.collections or []}

@router.post("/create-collection")
async def create_collection(name: str, description: str = None, private: bool = False, current_user=Depends(get_current_user)):
    collection = await coll_service.create_collection(name, description, private)
    await coll_service.add_collection_to_user(current_user, collection)
    return {"collection_id": str(collection.id), "name": collection.name}

@router.get("/collection/{collection_id}")
async def get_collection(collection_id: str, current_user=Depends(get_current_user)):
    collection = await coll_service.get_collection_by_id(collection_id)
    if collection in (current_user.collections or []):
        return {"collection": collection}
    return {"error": "Collection not found in your profile"}

@router.delete("/collection/{collection_id}")
async def delete_collection(collection_id: str, current_user=Depends(get_current_user)):
    collection = await coll_service.get_collection_by_id(collection_id)
    if collection in (current_user.collections or []):
        await coll_service.delete_collection(collection_id)
        current_user.collections.remove(collection)
        await current_user.save()
        return {"status": "Collection deleted"}
    return {"error": "Collection not found in your profile"}

@router.post("/collection/add-image/{collection_id}/{image_id}")
async def add_image_to_collection(collection_id: str, image_id: str, current_user=Depends(get_current_user)):
    collection = await coll_service.get_collection_by_id(collection_id)
    if collection in (current_user.collections or []):
        if not collection.images:
            collection.images = []
        image = await Image.get(image_id)
        if image:
            collection.images.append(image)
            await coll_service.update_collection(collection)
            return {"status": "Image added to collection"}
        return {"error": "Image not found"}
    return {"error": "Collection not found in your profile"}

@router.post("/search/text")
async def search_text(query: str, top_k: int = 10, current_user=Depends(get_current_user)):
    results = await search_service.search_by_text(query, top_k)
    return {"results": results}

@router.post("/search/image")
async def search_image(file: UploadFile = File(...), top_k: int = 10, current_user=Depends(get_current_user)):
    image_data = await file.read()
    results = await search_service.search_by_image(image_data, top_k)
    return {"results": results}

@router.get("/images")
async def get_all_images(current_user=Depends(get_current_user)):
    images = await image_service.get_all_images()
    return {"images": images}