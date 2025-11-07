from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    status: str


class HealthStatus(BaseModel):
    status: str
    elasticsearch: ServiceStatus
    mongodb: ServiceStatus
    model: ServiceStatus


MediaType = Literal["image", "video"]


class MediaItem(BaseModel):
    id: str
    media_url: str = Field(..., alias="mediaUrl")
    thumbnail_url: Optional[str] = Field(None, alias="thumbnailUrl")
    media_type: MediaType = Field(..., alias="mediaType")
    similarity_score: Optional[float] = Field(None, alias="similarityScore")

    class Config:
        populate_by_name = True


class SearchResults(BaseModel):
    query_id: str = Field(..., alias="queryId")
    items: List[MediaItem]
    total: Optional[int] = None
    search_time_ms: Optional[float] = Field(None, alias="searchTimeMs")


# Search Request Schemas
class SearchFilters(BaseModel):
    content_type: Optional[List[str]] = Field(None, alias="contentType")
    tags: Optional[List[str]] = None
    date_range: Optional[dict] = Field(None, alias="dateRange")  # {"start": "2025-01-01", "end": "2025-12-31"}


class SearchRequest(BaseModel):
    query_image: Optional[str] = Field(None, alias="queryImage")  # base64 or media_id
    query_text: Optional[str] = Field(None, alias="queryText")  # text query
    scope: str = "all"  # "all" | "my_images" | "shared" | "collection:{id}"
    limit: int = 20
    filters: Optional[SearchFilters] = None


# Authentication Schemas
class UserRegister(BaseModel):
    email: str
    username: str
    password: str


class UserRegisterResponse(BaseModel):
    user_id: str = Field(..., alias="userId")
    email: str
    username: str
    message: str = "Registration successful"


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str = Field(..., alias="accessToken")
    refresh_token: str = Field(..., alias="refreshToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    expires_in: int = Field(..., alias="expiresIn")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., alias="refreshToken")


class RefreshTokenResponse(BaseModel):
    access_token: str = Field(..., alias="accessToken")
    expires_in: int = Field(..., alias="expiresIn")


class MessageResponse(BaseModel):
    message: str


# Media Upload Schemas
class MediaUploadResponse(BaseModel):
    media_id: str = Field(..., alias="mediaId")
    filename: str
    file_size: int = Field(..., alias="fileSize")
    visibility: str
    upload_date: str = Field(..., alias="uploadDate")
    embedding_status: str = Field(default="processing", alias="embeddingStatus")


class MediaMetadata(BaseModel):
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None  # For videos
    format: Optional[str] = None


# Collection Schemas
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = Field(default=False, alias="isPublic")


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = Field(None, alias="isPublic")


class CollectionResponse(BaseModel):
    collection_id: str = Field(..., alias="collectionId")
    name: str
    description: str
    media_count: int = Field(..., alias="mediaCount")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")
    is_public: bool = Field(..., alias="isPublic")

    class Config:
        populate_by_name = True


class CollectionListResponse(BaseModel):
    collections: List[CollectionResponse]


class AddMediaToCollectionRequest(BaseModel):
    media_ids: List[str] = Field(..., alias="mediaIds")


class AddMediaToCollectionResponse(BaseModel):
    added: int
    message: str
