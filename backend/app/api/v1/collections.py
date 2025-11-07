from __future__ import annotations

import logging
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_active_user, get_current_user_optional
from app.models.collection import Collection
from app.models.media import Media
from app.models.schemas import (
    AddMediaToCollectionRequest,
    AddMediaToCollectionResponse,
    CollectionCreate,
    CollectionListResponse,
    CollectionResponse,
    CollectionUpdate,
    MessageResponse,
)
from app.models.user import User

logger = logging.getLogger(__name__)

collections_router = APIRouter(prefix="/collections", tags=["collections"])


@collections_router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_active_user),
) -> CollectionResponse:
    """Create a new collection."""
    collection = Collection(
        user_id=current_user._id,
        name=collection_data.name,
        description=collection_data.description or "",
        is_public=collection_data.is_public,
    )
    
    collection_id = collection.save()
    
    return CollectionResponse(
        collectionId=str(collection_id),
        name=collection.name,
        description=collection.description,
        mediaCount=len(collection.media_ids),
        createdAt=collection.created_at.isoformat(),
        updatedAt=collection.updated_at.isoformat(),
        isPublic=collection.is_public,
    )


@collections_router.get("", response_model=CollectionListResponse)
async def get_collections(
    user_id: Optional[str] = Query(None, alias="userId"),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> CollectionListResponse:
    """Get collections. If user_id is provided, get that user's collections. Otherwise, get current user's collections."""
    # If user_id is provided, use it (for admin or public access)
    # Otherwise, use current user
    target_user_id = user_id if user_id else (str(current_user._id) if current_user else None)
    
    if not target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id parameter required or user must be authenticated",
        )
    
    collections = Collection.find_by_user(target_user_id)
    
    collection_responses = [
        CollectionResponse(
            collectionId=str(c._id),
            name=c.name,
            description=c.description,
            mediaCount=len(c.media_ids),
            createdAt=c.created_at.isoformat(),
            updatedAt=c.updated_at.isoformat(),
            isPublic=c.is_public,
        )
        for c in collections
    ]
    
    return CollectionListResponse(collections=collection_responses)


@collections_router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: Optional[User] = Depends(get_current_active_user),
) -> CollectionResponse:
    """Get a specific collection by ID."""
    from app.core.dependencies import get_current_user_optional
    
    collection = Collection.find_by_id(collection_id)
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )
    
    # Check access: public collections or own collections
    if not collection.is_public and (not current_user or collection.user_id != current_user._id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to view this collection",
        )
    
    return CollectionResponse(
        collectionId=str(collection._id),
        name=collection.name,
        description=collection.description,
        mediaCount=len(collection.media_ids),
        createdAt=collection.created_at.isoformat(),
        updatedAt=collection.updated_at.isoformat(),
        isPublic=collection.is_public,
    )


@collections_router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_active_user),
) -> CollectionResponse:
    """Update a collection (only owner can update)."""
    collection = Collection.find_by_id(collection_id)
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )
    
    # Verify ownership
    if collection.user_id != current_user._id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own collections",
        )
    
    # Update fields
    if collection_data.name is not None:
        collection.name = collection_data.name
    if collection_data.description is not None:
        collection.description = collection_data.description
    if collection_data.is_public is not None:
        collection.is_public = collection_data.is_public
    
    collection.save()
    
    return CollectionResponse(
        collectionId=str(collection._id),
        name=collection.name,
        description=collection.description,
        mediaCount=len(collection.media_ids),
        createdAt=collection.created_at.isoformat(),
        updatedAt=collection.updated_at.isoformat(),
        isPublic=collection.is_public,
    )


@collections_router.delete("/{collection_id}", response_model=MessageResponse)
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_active_user),
) -> MessageResponse:
    """Delete a collection (only owner can delete)."""
    collection = Collection.find_by_id(collection_id)
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )
    
    # Verify ownership
    if collection.user_id != current_user._id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own collections",
        )
    
    collection.delete()
    
    return MessageResponse(message="Collection deleted successfully")


@collections_router.post("/{collection_id}/media", response_model=AddMediaToCollectionResponse)
async def add_media_to_collection(
    collection_id: str,
    request: AddMediaToCollectionRequest,
    current_user: User = Depends(get_current_active_user),
) -> AddMediaToCollectionResponse:
    """Add media to a collection."""
    collection = Collection.find_by_id(collection_id)
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )
    
    # Verify ownership
    if collection.user_id != current_user._id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add media to your own collections",
        )
    
    added_count = 0
    for media_id_str in request.media_ids:
        # Verify media exists and belongs to user
        media = Media.find_by_id(media_id_str)
        if not media:
            logger.warning(f"Media not found: {media_id_str}")
            continue
        
        if media.owner_id != current_user._id:
            logger.warning(f"User {current_user._id} tried to add media {media_id_str} they don't own")
            continue
        
        # Add to collection
        if collection.add_media(media_id_str):
            added_count += 1
    
    return AddMediaToCollectionResponse(
        added=added_count,
        message=f"Added {added_count} media item(s) to collection",
    )


@collections_router.delete("/{collection_id}/media/{media_id}", response_model=MessageResponse)
async def remove_media_from_collection(
    collection_id: str,
    media_id: str,
    current_user: User = Depends(get_current_active_user),
) -> MessageResponse:
    """Remove media from a collection."""
    collection = Collection.find_by_id(collection_id)
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found",
        )
    
    # Verify ownership
    if collection.user_id != current_user._id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only remove media from your own collections",
        )
    
    if collection.remove_media(media_id):
        return MessageResponse(message="Media removed from collection")
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found in collection",
        )

