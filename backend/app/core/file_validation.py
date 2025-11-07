from __future__ import annotations

import imghdr
import mimetypes
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()


def get_allowed_image_types() -> list[str]:
    """Get list of allowed image MIME types from config."""
    return [t.strip() for t in settings.allowed_image_types.split(",")]


def get_allowed_video_types() -> list[str]:
    """Get list of allowed video MIME types from config."""
    return [t.strip() for t in settings.allowed_video_types.split(",")]


def get_allowed_types() -> list[str]:
    """Get all allowed MIME types."""
    return get_allowed_image_types() + get_allowed_video_types()


def is_image(content_type: str) -> bool:
    """Check if content type is an image."""
    return content_type.startswith("image/") and content_type in get_allowed_image_types()


def is_video(content_type: str) -> bool:
    """Check if content type is a video."""
    return content_type.startswith("video/") and content_type in get_allowed_video_types()


def validate_file_type(content_type: str, filename: Optional[str] = None) -> None:
    """Validate that file type is allowed."""
    if content_type not in get_allowed_types():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{content_type}' not allowed. Allowed types: {', '.join(get_allowed_types())}",
        )


def validate_file_size(file_size: int, content_type: str) -> None:
    """Validate that file size is within limits."""
    if is_image(content_type):
        max_size = settings.max_image_size
        max_size_mb = max_size / (1024 * 1024)
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image file too large. Maximum size: {max_size_mb:.1f}MB",
            )
    elif is_video(content_type):
        max_size = settings.max_video_size
        max_size_mb = max_size / (1024 * 1024)
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video file too large. Maximum size: {max_size_mb:.1f}MB",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown file type",
        )


async def validate_upload_file(file: UploadFile) -> tuple[str, int]:
    """Validate uploaded file and return content_type and file_size."""
    # Check content type
    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type not specified",
        )
    
    validate_file_type(file.content_type, file.filename)
    
    # Read file to get size and validate
    contents = await file.read()
    file_size = len(contents)
    
    # Reset file pointer
    await file.seek(0)
    
    # Validate file size
    validate_file_size(file_size, file.content_type)
    
    return file.content_type, file_size

