"""
Response schemas for API endpoints.
These match the TypeScript types expected by the frontend.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MediaItemResponse(BaseModel):
    """Response model for a single media item (matches frontend MediaItem type)."""
    id: str = Field(..., description="Unique media identifier")
    filename: str = Field(..., description="Original filename")
    mediaUrl: str = Field(..., description="Full-resolution media URL")
    thumbnailUrl: str = Field(..., description="Thumbnail URL (300x300)")
    mediaType: str = Field(default="image", description="Media type: image or video")
    similarityScore: Optional[float] = Field(None, description="Similarity score (for search results)")
    fileSize: int = Field(..., description="File size in bytes")
    uploadDate: str = Field(..., description="ISO 8601 upload timestamp")
    tags: List[str] = Field(default_factory=list, description="Media tags")
    visibility: str = Field(default="private", description="Visibility: public or private")
    ownerId: str = Field(..., description="User ID of the owner")
    title: Optional[str] = Field(None, description="Media title")
    description: Optional[str] = Field(None, description="Media description")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "filename": "golden_retriever.jpg",
                "mediaUrl": "https://res.cloudinary.com/demo/image/upload/v1234567890/nexus/user123/abc123.jpg",
                "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/c_fill,h_300,w_300/v1234567890/nexus/user123/abc123.jpg",
                "mediaType": "image",
                "similarityScore": 0.95,
                "fileSize": 245678,
                "uploadDate": "2025-12-11T12:00:00Z",
                "tags": ["dog", "golden retriever", "pet"],
                "visibility": "public",
                "ownerId": "user123",
                "title": "Golden Retriever",
                "description": "A beautiful golden retriever playing in the park"
            }
        }


class UploadResponse(BaseModel):
    """Response model for media upload (matches frontend UploadResponse type)."""
    mediaId: str = Field(..., description="ID of the uploaded media")
    filename: str = Field(..., description="Original filename")
    fileSize: int = Field(..., description="File size in bytes")
    visibility: str = Field(..., description="Visibility setting")
    uploadDate: str = Field(..., description="ISO 8601 upload timestamp")
    embeddingStatus: str = Field(default="processing", description="Embedding generation status")
    mediaUrl: str = Field(..., description="Full media URL")
    thumbnailUrl: str = Field(..., description="Thumbnail URL")

    class Config:
        json_schema_extra = {
            "example": {
                "mediaId": "507f1f77bcf86cd799439011",
                "filename": "cat.jpg",
                "fileSize": 123456,
                "visibility": "private",
                "uploadDate": "2025-12-11T12:00:00Z",
                "embeddingStatus": "completed",
                "mediaUrl": "https://res.cloudinary.com/.../cat.jpg",
                "thumbnailUrl": "https://res.cloudinary.com/.../c_fill,h_300,w_300/.../cat.jpg"
            }
        }


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    items: List[MediaItemResponse] = Field(..., description="List of media items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    has_more: bool = Field(..., description="Whether more pages exist")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 42,
                "page": 1,
                "page_size": 20,
                "has_more": True
            }
        }


class SearchResponse(BaseModel):
    """Response model for search results (matches frontend SearchResults type)."""
    queryId: str = Field(..., description="Unique query identifier")
    items: List[MediaItemResponse] = Field(..., description="Search result items")
    total: Optional[int] = Field(None, description="Total results found")
    searchTimeMs: Optional[int] = Field(None, description="Search time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "queryId": "q_abc123",
                "items": [],
                "total": 15,
                "searchTimeMs": 142
            }
        }


class TokenResponse(BaseModel):
    """Response model for authentication tokens."""
    accessToken: str = Field(..., description="JWT access token")
    refreshToken: str = Field(..., description="JWT refresh token")
    tokenType: str = Field(default="bearer", description="Token type")
    expiresIn: int = Field(..., description="Token expiry time in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "tokenType": "bearer",
                "expiresIn": 1800
            }
        }


class CollectionResponse(BaseModel):
    """Response model for a collection."""
    id: str = Field(..., description="Collection ID")
    name: str = Field(..., description="Collection name")
    description: Optional[str] = Field(None, description="Collection description")
    mediaCount: int = Field(default=0, description="Number of media items")
    createdAt: str = Field(..., description="Creation timestamp")
    updatedAt: Optional[str] = Field(None, description="Last update timestamp")
    isPublic: bool = Field(default=False, description="Whether collection is public")
    coverImageId: Optional[str] = Field(None, description="ID of cover image")
    coverImageUrl: Optional[str] = Field(None, description="URL of cover image")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Big Cats",
                "description": "Collection of wild big cats",
                "mediaCount": 15,
                "createdAt": "2025-12-11T12:00:00Z",
                "updatedAt": "2025-12-11T14:00:00Z",
                "isPublic": True,
                "coverImageId": "507f1f77bcf86cd799439012",
                "coverImageUrl": "https://res.cloudinary.com/.../tiger.jpg"
            }
        }


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str = Field(..., description="Response message")
    detail: Optional[str] = Field(None, description="Additional details")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully",
                "detail": "5 items were updated"
            }
        }
