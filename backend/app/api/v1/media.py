from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_current_active_user, get_current_user_optional
from app.core.file_validation import validate_upload_file
from app.models.database import get_gridfs_bucket
from app.models.media import Media
from app.models.schemas import MediaItem, MediaUploadResponse, MessageResponse, SearchResults
from app.models.user import User

logger = logging.getLogger(__name__)

media_router = APIRouter(prefix="/media", tags=["media"])


@media_router.post("/upload", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    visibility: str = Query(default="private", regex="^(public|private)$"),
    tags: str = Query(default=""),
    current_user: User = Depends(get_current_active_user),
) -> MediaUploadResponse:
    """Upload a media file."""
    # Validate file
    content_type, file_size = await validate_upload_file(file)
    
    # Check storage quota
    available_space = current_user.storage_quota - current_user.storage_used
    if file_size > available_space:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Insufficient storage quota. Available: {available_space / (1024*1024):.2f}MB, Required: {file_size / (1024*1024):.2f}MB",
        )
    
    # Store file in GridFS
    gridfs_bucket = get_gridfs_bucket()
    try:
        # Read file contents
        file_contents = await file.read()
        
        # Store in GridFS
        gridfs_id = gridfs_bucket.put(
            file_contents,
            filename=file.filename,
            content_type=content_type,
        )
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
        
        # Create media document
        media = Media(
            filename=file.filename or "unknown",
            content_type=content_type,
            file_size=file_size,
            gridfs_id=gridfs_id,
            owner_id=current_user._id,
            visibility=visibility,
            tags=tag_list,
        )
        
        media_id = media.save()
        
        # Update user storage
        new_storage_used = current_user.storage_used + file_size
        current_user.update_storage_used(new_storage_used)
        
        # Trigger embedding extraction and indexing (async - will be processed in background)
        # For now, we'll do it synchronously, but in production this should be a background task
        try:
            from app.services.embeddings import extract_image_embedding
            from app.services.search import index_media_embedding
            
            # Only index images for now (videos need frame extraction)
            if content_type.startswith("image/"):
                embedding = extract_image_embedding(file_contents)
                await index_media_embedding(
                    media_id=str(media_id),
                    embedding=embedding,
                    owner_id=str(current_user._id) if current_user else None,
                    visibility=visibility,
                    content_type=content_type,
                    tags=tag_list,
                    upload_date=media.upload_date.isoformat(),
                )
                # Update embedding status
                from app.models.database import get_mongo_client
                from app.config import get_settings
                settings = get_settings()
                client = get_mongo_client()
                client[settings.mongodb_db]["media"].update_one(
                    {"_id": media_id},
                    {"$set": {"embedding_indexed": True}}
                )
                embedding_status = "indexed"
            else:
                embedding_status = "processing"  # Videos need frame extraction
        except Exception as e:
            logger.warning(f"Failed to index embedding for media {media_id}: {e}")
            embedding_status = "processing"
        
        logger.info(f"Media uploaded: {media_id} by user {current_user._id}")
        
        return MediaUploadResponse(
            mediaId=str(media_id),
            filename=media.filename,
            fileSize=media.file_size,
            visibility=media.visibility,
            uploadDate=media.upload_date.isoformat(),
            embeddingStatus=embedding_status,
        )
    
    except Exception as e:
        logger.error(f"Error uploading media: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload media file",
        )


@media_router.get("/{media_id}", response_model=MediaItem)
async def get_media(
    media_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> MediaItem:
    """Get media file with access control."""
    media = Media.find_by_id(media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    # Access control: public media or owned by user
    if media.visibility == "public":
        # Public media - anyone can access
        pass
    elif current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access private media",
        )
    elif media.owner_id != current_user._id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't own this media",
        )
    
    # Get file from GridFS
    gridfs_bucket = get_gridfs_bucket()
    try:
        gridfs_file = gridfs_bucket.get(media.gridfs_id)
        file_data = gridfs_file.read()
        
        # Determine media type
        media_type = "image" if media.content_type.startswith("image/") else "video"
        
        # Build media URL (in production, you might want to use a CDN or object storage)
        media_url = f"/api/v1/media/{media_id}/file"
        thumbnail_url = f"/api/v1/media/{media_id}/thumbnail" if media_type == "image" else None
        
        return MediaItem(
            id=str(media._id),
            mediaUrl=media_url,
            thumbnailUrl=thumbnail_url,
            mediaType=media_type,
        )
    except Exception as e:
        logger.error(f"Error retrieving media: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve media file",
        )


@media_router.get("/{media_id}/file")
async def get_media_file(
    media_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> StreamingResponse:
    """Stream media file with access control."""
    media = Media.find_by_id(media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    # Access control
    if media.visibility == "public":
        pass
    elif current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    elif media.owner_id != current_user._id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Get file from GridFS
    gridfs_bucket = get_gridfs_bucket()
    try:
        gridfs_file = gridfs_bucket.get(media.gridfs_id)
        
        def generate():
            chunk_size = 8192
            while True:
                chunk = gridfs_file.read(chunk_size)
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            generate(),
            media_type=media.content_type,
            headers={
                "Content-Disposition": f'inline; filename="{media.filename}"',
            },
        )
    except Exception as e:
        logger.error(f"Error streaming media: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stream media file",
        )


@media_router.get("/", response_model=SearchResults)
async def list_user_media(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
) -> SearchResults:
    """List all media owned by the current user."""
    try:
        # Get user's media
        media_list = Media.find_by_owner(str(current_user._id), limit=page_size * page)
        
        # Convert to MediaItem format
        media_items = []
        for media in media_list:
            media_items.append(MediaItem(
                id=str(media._id),
                filename=media.filename,
                mediaType=media.content_type.split("/")[0] if media.content_type else "image",
                mediaUrl=f"/api/v1/media/{media._id}/file",
                uploadDate=media.upload_date.isoformat() if media.upload_date else "",
                fileSize=media.file_size,
                tags=media.tags or [],
                visibility=media.visibility,
                ownerId=str(media.owner_id),
            ))
        
        # Paginate
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_items = media_items[start_idx:end_idx]
        
        return SearchResults(
            queryId="",
            items=paginated_items,
            total=len(media_items),
            searchTimeMs=0,
        )
    except Exception as e:
        logger.error(f"Error listing user media: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list media",
        )


@media_router.delete("/{media_id}", response_model=MessageResponse)
async def delete_media(
    media_id: str,
    current_user: User = Depends(get_current_active_user),
) -> MessageResponse:
    """Delete media file (only owner can delete)."""
    media = Media.find_by_id(media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    # Verify ownership
    if media.owner_id != current_user._id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own media",
        )
    
    # Delete from GridFS
    gridfs_bucket = get_gridfs_bucket()
    try:
        gridfs_bucket.delete(media.gridfs_id)
        
        # Delete from MongoDB
        media.delete()
        
        # Update user storage
        new_storage_used = max(0, current_user.storage_used - media.file_size)
        current_user.update_storage_used(new_storage_used)
        
        # Delete from Elasticsearch index
        from app.services.search import delete_media_embedding
        await delete_media_embedding(str(media._id))
        
        # TODO: Remove from collections
        
        logger.info(f"Media deleted: {media_id} by user {current_user._id}")
        
        return MessageResponse(message="Media deleted successfully")
    
    except Exception as e:
        logger.error(f"Error deleting media: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete media file",
        )

