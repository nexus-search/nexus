"""
Media management endpoints for upload, retrieval, and deletion.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from fastapi.responses import RedirectResponse
from typing import Optional
import tempfile
import os
from datetime import datetime

from app.util.current_user import get_current_user
from app.models.user import User
from app.models.image import Image
from app.services.cloudinaryservice import cloudinary_service
from app.services.imageservice import ImageService
from app.elasticsearch.client import ESClient
from app.schemas.responses import (
    MediaItemResponse,
    UploadResponse,
    PaginatedResponse,
    MessageResponse
)
from app.config import settings

router = APIRouter(prefix="/media", tags=["media"])
image_service = ImageService()
es_client = ESClient()


def _image_to_media_response(
    image: Image,
    similarity_score: Optional[float] = None
) -> MediaItemResponse:
    """Convert Image model to MediaItemResponse."""
    # Use medium_url or file_path for full image, thumbnail_url for thumbnails
    media_url = getattr(image, 'medium_url', None) or image.file_path or ""
    thumbnail_url = getattr(image, 'thumbnail_url', media_url)

    return MediaItemResponse(
        id=str(image.id),
        filename=image.title or "untitled",
        mediaUrl=media_url,
        thumbnailUrl=thumbnail_url,
        mediaType="image",
        similarityScore=similarity_score,
        fileSize=getattr(image, 'file_size', 0),
        uploadDate=getattr(image, 'created_at', datetime.utcnow()).isoformat(),
        tags=getattr(image, 'tags', []),
        visibility=getattr(image, 'visibility', 'private'),
        ownerId=getattr(image, 'owner_id', ''),
        title=image.title,
        description=image.description
    )


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_media(
    file: UploadFile = File(...),
    title: Optional[str] = Query(None, description="Media title"),
    description: Optional[str] = Query(None, description="Media description"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    visibility: str = Query("private", description="Visibility: public or private"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a new media file (image).

    Process:
    1. Validate file type and size
    2. Upload to Cloudinary
    3. Generate CLIP embedding
    4. Save metadata to MongoDB
    5. Index embedding in Elasticsearch

    Returns:
        UploadResponse with media ID and URLs
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Expected image/*, got {file.content_type}"
        )

    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)

    if file_size > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_IMAGE_SIZE / 1024 / 1024:.1f}MB"
        )

    # Reset file pointer
    await file.seek(0)

    try:
        # Save to temporary file for Cloudinary upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name

        # Upload to Cloudinary
        upload_result = cloudinary_service.upload_image(
            file_path=temp_path,
            user_id=str(current_user.id),
            tags=tags.split(',') if tags else []
        )

        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(',')] if tags else []

        # Create Image document
        image_title = title or file.filename
        image = Image(
            title=image_title,
            description=description or "",
            file_path=upload_result['secure_url']
        )

        # Add custom fields for our application
        image.thumbnail_url = upload_result['thumbnail_url']
        image.medium_url = upload_result['medium_url']
        image.cloudinary_public_id = upload_result['public_id']
        image.file_size = file_size
        image.visibility = visibility
        image.owner_id = str(current_user.id)
        image.tags = tag_list
        image.created_at = datetime.utcnow()

        # Save to MongoDB
        await image.insert()

        # Generate CLIP embedding from the temporary file
        embedding = Image.generate_image_embedding(temp_path)

        # Index in Elasticsearch
        await es_client.index_image(str(image.id), embedding)

        # Clean up temporary file
        os.unlink(temp_path)

        return UploadResponse(
            mediaId=str(image.id),
            filename=file.filename,
            fileSize=file_size,
            visibility=visibility,
            uploadDate=image.created_at.isoformat(),
            embeddingStatus="completed",
            mediaUrl=upload_result['secure_url'],
            thumbnailUrl=upload_result['thumbnail_url']
        )

    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/public", response_model=PaginatedResponse)
async def list_public_media(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
):
    """
    List public media items with pagination. No authentication required.

    Returns:
        PaginatedResponse with public media items
    """
    try:
        # Get public images with proper database-level pagination
        public_images = await image_service.repo.find_public(page=page, limit=page_size)
        total = await image_service.repo.count_public()

        print(f"[DEBUG] Found {len(public_images)} public images, total: {total}, page: {page}, page_size: {page_size}")

        items = [_image_to_media_response(img) for img in public_images]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=(page * page_size) < total
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list public media: {str(e)}")


@router.get("/{media_id}", response_model=MediaItemResponse)
async def get_media(media_id: str):
    """
    Get metadata for a specific media item.

    Args:
        media_id: The ID of the media item

    Returns:
        MediaItemResponse with full metadata
    """
    try:
        image = await Image.get(media_id)
        if not image:
            raise HTTPException(status_code=404, detail="Media not found")

        return _image_to_media_response(image)

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Media not found: {str(e)}")


@router.get("/{media_id}/file")
async def get_media_file(media_id: str):
    """
    Get the actual media file (redirects to Cloudinary URL).

    Args:
        media_id: The ID of the media item

    Returns:
        Redirect to Cloudinary URL
    """
    try:
        image = await Image.get(media_id)
        if not image:
            raise HTTPException(status_code=404, detail="Media not found")

        # Redirect to Cloudinary URL
        return RedirectResponse(url=image.file_path)

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Media not found: {str(e)}")


@router.get("", response_model=PaginatedResponse)
async def list_user_media(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    visibility: Optional[str] = Query(None, description="Filter by visibility"),
    current_user: User = Depends(get_current_user)
):
    """
    List media items for the current user with pagination.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        visibility: Optional filter by visibility (public/private)

    Returns:
        PaginatedResponse with user's media items
    """
    try:
        # Get all images for the user
        # Note: This is a simplified implementation. In production, you'd want to:
        # 1. Add owner_id field to Image model
        # 2. Create a proper query with pagination
        # 3. Use MongoDB aggregation for better performance

        all_images = await image_service.get_all_images()

        # Filter by owner and visibility
        user_images = [
            img for img in all_images
            if getattr(img, 'owner_id', '') == str(current_user.id) and
            (visibility is None or getattr(img, 'visibility', 'private') == visibility)
        ]

        # Calculate pagination
        total = len(user_images)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_images = user_images[start_idx:end_idx]

        # Convert to response models
        items = [_image_to_media_response(img) for img in page_images]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_more=end_idx < total
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list media: {str(e)}")


@router.delete("/{media_id}", response_model=MessageResponse)
async def delete_media(
    media_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a media item.

    Process:
    1. Verify ownership
    2. Delete from Elasticsearch
    3. Delete from Cloudinary
    4. Delete from MongoDB

    Args:
        media_id: The ID of the media item to delete

    Returns:
        MessageResponse confirming deletion
    """
    try:
        # Get the image
        image = await Image.get(media_id)
        if not image:
            raise HTTPException(status_code=404, detail="Media not found")

        # Verify ownership
        if getattr(image, 'owner_id', '') != str(current_user.id):
            raise HTTPException(status_code=403, detail="You don't have permission to delete this media")

        # Delete from Elasticsearch
        try:
            await es_client.delete_document(media_id)
        except Exception as e:
            print(f"Warning: Failed to delete from Elasticsearch: {e}")

        # Delete from Cloudinary
        if hasattr(image, 'cloudinary_public_id') and image.cloudinary_public_id:
            try:
                cloudinary_service.delete_image(image.cloudinary_public_id)
            except Exception as e:
                print(f"Warning: Failed to delete from Cloudinary: {e}")

        # Delete from MongoDB
        await image.delete()

        return MessageResponse(
            message="Media deleted successfully",
            detail=f"Deleted media with ID: {media_id}"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete media: {str(e)}")
