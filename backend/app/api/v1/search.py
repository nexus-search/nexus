from __future__ import annotations

import base64
import logging
import random
import string
from io import BytesIO
from typing import Optional

import numpy as np
from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile, status
from PIL import Image

from app.core.dependencies import get_current_user_optional
from app.models.database import get_gridfs_bucket
from app.models.media import Media
from app.models.schemas import SearchFilters, SearchRequest, SearchResults
from app.models.user import User
from app.services.embeddings import extract_image_embedding, extract_text_embedding
from app.services.search import search_media

logger = logging.getLogger(__name__)

search_router = APIRouter(prefix="/search", tags=["search"])


def _generate_query_id(prefix: str = "q") -> str:
    """Generate a unique query ID."""
    return f"{prefix}_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"


@search_router.post("/similar", response_model=SearchResults)
async def search_similar(
    file: UploadFile = File(...),
    scope: str = Query(default="all", regex="^(all|my_images|shared|collection:.*)$"),
    limit: int = Query(default=20, ge=1, le=100),
    threshold: float = Query(default=0.5, ge=0.0, le=1.0),
    content_type: Optional[str] = Query(None, alias="contentType"),
    tags: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> SearchResults:
    """
    Search for similar media using an uploaded image.
    
    - **file**: Image file to search with
    - **scope**: Search scope (all, my_images, shared, collection:{id})
    - **limit**: Maximum number of results
    - **threshold**: Minimum similarity score (0.0-1.0)
    - **content_type**: Filter by content type (optional)
    - **tags**: Comma-separated tags to filter by (optional)
    """
    query_id = _generate_query_id("sim")
    
    try:
        # Read and validate file
        file_contents = await file.read()
        if len(file_contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file provided",
            )
        
        # Extract embedding from uploaded image
        query_embedding = extract_image_embedding(file_contents)
        
        # Build filters
        filters = None
        if content_type or tags:
            filters = SearchFilters(
                content_type=[content_type] if content_type else None,
                tags=[t.strip() for t in tags.split(",")] if tags else None,
            )
        
        # Get user ID if authenticated
        user_id = str(current_user._id) if current_user else None
        
        # Perform search
        media_items, total, search_time = await search_media(
            query_embedding=query_embedding,
            user_id=user_id,
            scope=scope,
            limit=limit,
            filters=filters,
        )
        
        # Filter by threshold
        if threshold > 0:
            media_items = [item for item in media_items if (item.similarityScore or 0) >= threshold]
        
        return SearchResults(
            queryId=query_id,
            items=media_items,
            total=len(media_items),
            searchTimeMs=search_time,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_similar: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform similarity search",
        )


@search_router.post("/by-image", response_model=SearchResults)
async def search_by_image(
    request: SearchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> SearchResults:
    """
    Search for similar media using an image (base64 or media_id).
    
    Request body:
    - **queryImage**: Base64 encoded image or media_id
    - **scope**: Search scope
    - **limit**: Maximum results
    - **filters**: Additional filters
    """
    query_id = _generate_query_id("img")
    
    if not request.query_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="queryImage is required",
        )
    
    try:
        query_embedding = None
        
        # Check if it's a media_id (ObjectId format) or base64
        if len(request.query_image) < 50:  # Likely a media_id
            # Try to get media from MongoDB
            media = Media.find_by_id(request.query_image)
            if media:
                # Get file from GridFS
                gridfs_bucket = get_gridfs_bucket()
                gridfs_file = gridfs_bucket.get(media.gridfs_id)
                file_contents = gridfs_file.read()
                query_embedding = extract_image_embedding(file_contents)
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Media not found",
                )
        else:
            # Assume base64 encoded image
            try:
                # Remove data URL prefix if present
                if "," in request.query_image:
                    request.query_image = request.query_image.split(",", 1)[1]
                
                image_data = base64.b64decode(request.query_image)
                query_embedding = extract_image_embedding(image_data)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid base64 image: {str(e)}",
                )
        
        # Get user ID
        user_id = str(current_user._id) if current_user else None
        
        # Perform search
        media_items, total, search_time = await search_media(
            query_embedding=query_embedding,
            user_id=user_id,
            scope=request.scope,
            limit=request.limit,
            filters=request.filters,
        )
        
        return SearchResults(
            queryId=query_id,
            items=media_items,
            total=total,
            searchTimeMs=search_time,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_by_image: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform image search",
        )


@search_router.post("/by-text", response_model=SearchResults)
async def search_by_text(
    request: SearchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> SearchResults:
    """
    Search for media using text query (text-to-image search).
    
    Request body:
    - **queryText**: Text description to search for
    - **scope**: Search scope
    - **limit**: Maximum results
    - **filters**: Additional filters
    """
    query_id = _generate_query_id("txt")
    
    if not request.query_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="queryText is required",
        )
    
    try:
        # Extract text embedding
        query_embedding = extract_text_embedding(request.query_text)
        
        # Get user ID
        user_id = str(current_user._id) if current_user else None
        
        # Perform search
        media_items, total, search_time = await search_media(
            query_embedding=query_embedding,
            user_id=user_id,
            scope=request.scope,
            limit=request.limit,
            filters=request.filters,
        )
        
        return SearchResults(
            queryId=query_id,
            items=media_items,
            total=total,
            searchTimeMs=search_time,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_by_text: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform text search",
        )


@search_router.get("/text", response_model=SearchResults)
async def search_text_legacy(
    query: str = Query(...),
    scope: str = Query(default="all", regex="^(all|my_images|shared|collection:.*)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> SearchResults:
    """
    Legacy text search endpoint (for backward compatibility).
    """
    query_id = _generate_query_id("txt")
    
    try:
        # Extract text embedding
        query_embedding = extract_text_embedding(query)
        
        # Get user ID
        user_id = str(current_user._id) if current_user else None
        
        # Perform search
        limit = page_size
        media_items, total, search_time = await search_media(
            query_embedding=query_embedding,
            user_id=user_id,
            scope=scope,
            limit=limit,
            filters=None,
        )
        
        # Pagination
        start = (page - 1) * page_size
        paginated_items = media_items[start : start + page_size]
        
        return SearchResults(
            queryId=query_id,
            items=paginated_items,
            total=total,
            searchTimeMs=search_time,
        )
    
    except Exception as e:
        logger.error(f"Error in search_text_legacy: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform text search",
        )

