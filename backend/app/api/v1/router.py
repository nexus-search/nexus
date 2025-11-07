import random
import string
import urllib.parse
from typing import List

from fastapi import APIRouter, Body, Query, UploadFile, File

from app.models.schemas import MediaItem, SearchResults


api_router = APIRouter(prefix="/api/v1")


def _generate_mock_items(query: str, count: int) -> List[MediaItem]:
    items = []
    for i in range(count):
        seed = f"{query}_{i}"
        media_url = f"https://picsum.photos/seed/{seed}/1200/800"
        thumbnail_url = f"https://picsum.photos/seed/{seed}/400/300"
        items.append(
            MediaItem(
                id=f"m_{i}",
                mediaUrl=media_url,
                thumbnailUrl=thumbnail_url,
                mediaType="image",
                similarityScore=random.uniform(0.5, 1.0),
            )
        )
    return items


@api_router.get("/search/text", response_model=SearchResults)
async def search_text(
    query: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
) -> SearchResults:
    query_id = f"txt_{''.join(random.choices(string.ascii_lowercase + string.digits, k=6))}"
    items = _generate_mock_items(urllib.parse.quote(query), 60)
    start = (page - 1) * page_size
    paginated_items = items[start : start + page_size]
    return SearchResults(queryId=query_id, items=paginated_items, total=len(items))


@api_router.post("/search/similar", response_model=SearchResults)
async def search_similar(
    file: UploadFile = File(...),
    threshold: float = Body(0.5),
    page: int = Body(1),
    page_size: int = Body(12),
) -> SearchResults:
    query_id = f"sim_{''.join(random.choices(string.ascii_lowercase + string.digits, k=6))}"
    items = _generate_mock_items(file.filename, 60)
    start = (page - 1) * page_size
    paginated_items = items[start : start + page_size]
    return SearchResults(queryId=query_id, items=paginated_items, total=len(items))


@api_router.get("/search/results/{query_id}", response_model=SearchResults)
async def get_search_results(
    query_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
) -> SearchResults:
    items = _generate_mock_items(query_id, 60)
    start = (page - 1) * page_size
    paginated_items = items[start : start + page_size]
    return SearchResults(queryId=query_id, items=paginated_items, total=len(items))


@api_router.get("/media/{media_id}", response_model=MediaItem)
async def get_media(media_id: str) -> MediaItem:
    seed = urllib.parse.quote(media_id)
    return MediaItem(
        id=media_id,
        mediaUrl=f"https://picsum.photos/seed/{seed}/1200/800",
        thumbnailUrl=f"https://picsum.photos/seed/{seed}/400/300",
        mediaType="image",
    )

