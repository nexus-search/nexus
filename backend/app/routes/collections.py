"""
Collection management endpoints.
Consolidated from /use routes with proper RESTful structure.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.util.current_user import get_current_user
from app.models.user import User
from app.models.image import Image
from app.models.collection import Collection
from app.services.collectionservice import CollectionService
from app.schemas.responses import (
    CollectionResponse,
    MediaItemResponse,
    PaginatedResponse,
    MessageResponse
)

router = APIRouter(prefix="/collections", tags=["collections"])
collection_service = CollectionService()


def _user_owns_collection(user: User, collection: Collection) -> bool:
    """Check if user owns the collection by comparing IDs."""
    user_collection_ids = {str(c.id) for c in (user.collections or [])}
    return str(collection.id) in user_collection_ids


# Request models
class CreateCollectionRequest(BaseModel):
    name: str
    description: Optional[str] = None
    isPublic: bool = False


class UpdateCollectionRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    isPublic: Optional[bool] = None
    coverImageId: Optional[str] = None


class AddMediaRequest(BaseModel):
    mediaIds: List[str]


def _collection_to_response(collection: Collection, owner: User) -> CollectionResponse:
    """Convert Collection model to CollectionResponse."""
    media_count = len(collection.images) if collection.images else 0
    cover_image_url = None

    # Get cover image URL
    if hasattr(collection, 'cover_image_id') and collection.cover_image_id:
        # Find the image in the collection
        for img in (collection.images or []):
            if str(img.id) == collection.cover_image_id:
                cover_image_url = getattr(img, 'thumbnail_url', img.file_path)
                break
    elif collection.images and len(collection.images) > 0:
        # Use first image as cover
        cover_image_url = getattr(collection.images[0], 'thumbnail_url', collection.images[0].file_path)

    return CollectionResponse(
        id=str(collection.id),
        name=collection.name,
        description=collection.description,
        mediaCount=media_count,
        createdAt=collection.created_at.isoformat() if collection.created_at else datetime.utcnow().isoformat(),
        updatedAt=collection.updated_at.isoformat() if collection.updated_at else None,
        isPublic=not collection.private,
        coverImageId=getattr(collection, 'cover_image_id', None),
        coverImageUrl=cover_image_url
    )


@router.get("", response_model=List[CollectionResponse])
async def list_collections(current_user: User = Depends(get_current_user)):
    """
    List all collections for the current user.
    """
    # Get collection IDs from user's embedded collections
    collection_ids = [str(coll.id) for coll in (current_user.collections or [])]
    
    # Fetch fresh collection documents from database
    collections = []
    for coll_id in collection_ids:
        collection = await collection_service.get_collection_by_id(coll_id)
        if collection:
            collections.append(collection)
    
    return [_collection_to_response(coll, current_user) for coll in collections]


@router.post("", response_model=CollectionResponse, status_code=201)
async def create_collection(
    data: CreateCollectionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new collection for the current user.
    """
    collection = await collection_service.create_collection(
        name=data.name,
        description=data.description,
        private=not data.isPublic
    )

    await collection_service.add_collection_to_user(current_user, collection)

    return _collection_to_response(collection, current_user)


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific collection by ID.
    """
    collection = await collection_service.get_collection_by_id(collection_id)

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check if user owns this collection
    if not _user_owns_collection(current_user, collection):
        raise HTTPException(status_code=403, detail="You don't have access to this collection")

    return _collection_to_response(collection, current_user)


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    data: UpdateCollectionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update collection metadata (name, description, privacy, cover image).
    """
    collection = await collection_service.get_collection_by_id(collection_id)

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check ownership
    if not _user_owns_collection(current_user, collection):
        raise HTTPException(status_code=403, detail="You don't have access to this collection")

    # Update fields
    if data.name is not None:
        collection.name = data.name
    if data.description is not None:
        collection.description = data.description
    if data.isPublic is not None:
        collection.private = not data.isPublic
    if data.coverImageId is not None:
        # Verify the image exists in the collection
        image_exists = any(str(img.id) == data.coverImageId for img in (collection.images or []))
        if not image_exists:
            raise HTTPException(status_code=400, detail="Cover image must be in the collection")
        collection.cover_image_id = data.coverImageId

    # Save changes
    updated_collection = await collection_service.update_collection(collection)

    return _collection_to_response(updated_collection, current_user)


@router.delete("/{collection_id}", response_model=MessageResponse)
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a collection.
    """
    collection = await collection_service.get_collection_by_id(collection_id)

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check ownership
    if not _user_owns_collection(current_user, collection):
        raise HTTPException(status_code=403, detail="You don't have access to this collection")

    # Remove from user's collections (filter by ID instead of object comparison)
    if current_user.collections:
        current_user.collections = [c for c in current_user.collections if str(c.id) != collection_id]
        await current_user.save()

    # Delete the collection
    await collection_service.delete_collection(collection_id)

    return MessageResponse(
        message="Collection deleted successfully",
        detail=f"Deleted collection: {collection.name}"
    )


@router.get("/{collection_id}/media", response_model=PaginatedResponse)
async def get_collection_media(
    collection_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated media items in a collection.
    """
    collection = await collection_service.get_collection_by_id(collection_id)

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check ownership (or public access in future)
    if not _user_owns_collection(current_user, collection):
        if collection.private:
            raise HTTPException(status_code=403, detail="You don't have access to this collection")

    # Get images
    all_images = collection.images or []
    total = len(all_images)

    # Paginate
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_images = all_images[start_idx:end_idx]

    # Convert to MediaItemResponse
    items = []
    for img in page_images:
        items.append(MediaItemResponse(
            id=str(img.id),
            filename=img.title or "untitled",
            mediaUrl=img.file_path or "",
            thumbnailUrl=getattr(img, 'thumbnail_url', img.file_path or ""),
            mediaType="image",
            fileSize=getattr(img, 'file_size', 0),
            uploadDate=getattr(img, 'created_at', '').isoformat() if hasattr(img, 'created_at') else '',
            tags=getattr(img, 'tags', []),
            visibility=getattr(img, 'visibility', 'private'),
            ownerId=getattr(img, 'owner_id', ''),
            title=img.title,
            description=img.description
        ))

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=end_idx < total
    )


@router.post("/{collection_id}/media", response_model=MessageResponse)
async def add_media_to_collection(
    collection_id: str,
    data: AddMediaRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Add multiple media items to a collection.
    """
    collection = await collection_service.get_collection_by_id(collection_id)

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check ownership
    if not _user_owns_collection(current_user, collection):
        raise HTTPException(status_code=403, detail="You don't have access to this collection")

    # Initialize images list if needed
    if not collection.images:
        collection.images = []

    # Add each image
    added_count = 0
    for media_id in data.mediaIds:
        try:
            image = await Image.get(media_id)
            if image:
                # Check if already in collection
                if not any(str(img.id) == media_id for img in collection.images):
                    collection.images.append(image)
                    added_count += 1
        except Exception as e:
            print(f"Failed to add image {media_id}: {e}")

    # Save collection
    await collection_service.update_collection(collection)

    return MessageResponse(
        message=f"Added {added_count} item(s) to collection",
        detail=f"Successfully added {added_count} out of {len(data.mediaIds)} items"
    )


@router.delete("/{collection_id}/media/{media_id}", response_model=MessageResponse)
async def remove_media_from_collection(
    collection_id: str,
    media_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Remove a media item from a collection.
    """
    collection = await collection_service.get_collection_by_id(collection_id)

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Check ownership
    if not _user_owns_collection(current_user, collection):
        raise HTTPException(status_code=403, detail="You don't have access to this collection")

    # Find and remove the image
    if collection.images:
        original_count = len(collection.images)
        collection.images = [img for img in collection.images if str(img.id) != media_id]

        if len(collection.images) == original_count:
            raise HTTPException(status_code=404, detail="Media not found in collection")

        # Save collection
        await collection_service.update_collection(collection)

    return MessageResponse(
        message="Media removed from collection",
        detail=f"Removed media {media_id} from collection {collection.name}"
    )
