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
