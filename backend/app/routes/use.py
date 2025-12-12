from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.util.current_user import get_current_user
from app.services.collectionservice import CollectionService
from app.services.searchservice import SearchService
from app.models.image import Image
from app.services.imageservice import ImageService
from app.schemas.responses import PaginatedResponse

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
async def search_text(
    query: str,
    scope: str = Query('public', regex='^(public|private|all)$'),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    """
    Search by text query with pagination.
    Returns media items matching the text query.
    """
    # Calculate top_k: fetch enough results for current page + buffer for filtering
    # If requesting page 2 with page_size 20, fetch at least 40 results
    top_k = page * page_size + 50  # Add buffer for filtering by scope
    
    results = await search_service.search_by_text(query, top_k=top_k)
    
    # Filter by scope
    if scope == 'public':
        results = [r for r in results if r.get('visibility') == 'public']
    elif scope == 'private':
        results = [r for r in results if r.get('owner_id') == str(current_user.id)]
    
    # Paginate
    total = len(results)  # Note: This is only the count of fetched results, not total in DB
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    items = results[start_idx:end_idx]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=end_idx < total
    )

@router.post("/search/image")
async def search_image(
    file: UploadFile = File(...),
    scope: str = Query('public', regex='^(public|private|all)$'),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    """
    Search by image with pagination.
    Upload an image to find visually similar media items.
    """
    # Calculate top_k: fetch enough results for current page + buffer for filtering
    top_k = page * page_size + 50  # Add buffer for filtering by scope
    
    image_data = await file.read()
    results = await search_service.search_by_image(image_data, top_k=top_k)
    
    # Filter by scope
    if scope == 'public':
        results = [r for r in results if r.get('visibility') == 'public']
    elif scope == 'private':
        results = [r for r in results if r.get('owner_id') == str(current_user.id)]
    
    # Paginate
    total = len(results)  # Note: This is only the count of fetched results, not total in DB
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    items = results[start_idx:end_idx]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=end_idx < total
    )

@router.get("/search/similar/{media_id}")
async def find_similar(
    media_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    """
    Find media items similar to a given media item using its embedding.

    Args:
        media_id: The ID of the media item to find similar items for
        page: Page number for pagination
        page_size: Number of items per page

    Returns:
        Paginated list of similar media items
    """
    # Calculate top_k: fetch enough results for current page + 1 to exclude source
    top_k = page * page_size + 50
    
    results = await search_service.search_by_media_id(media_id, top_k=top_k)
    
    # Paginate
    total = len(results)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    items = results[start_idx:end_idx]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=end_idx < total
    )

@router.get("/images")
async def get_all_images(current_user=Depends(get_current_user)):
    images = await image_service.get_all_images()
    return {"images": images}