import logging

from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import init_auth_indexes
from app.api.v1.router import api_router
from app.config import get_settings
from app.models.database import (
    close_clients,
    get_elasticsearch_client,
    init_clients,
    ping_elasticsearch,
    ping_mongodb,
)
from app.models.schemas import HealthStatus, ServiceStatus
from app.services.indexing import ensure_media_index


logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(title="Nexus Search Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _status_from_tuple(success: bool, message: str) -> ServiceStatus:
    return ServiceStatus(status="ok" if success else f"error: {message}")


def _initialise_infrastructure() -> None:
    init_clients()
    es_client = get_elasticsearch_client()
    ensure_media_index(es_client, settings.elasticsearch_index)
    init_auth_indexes()


@app.on_event("startup")
async def on_startup() -> None:
    await run_in_threadpool(_initialise_infrastructure)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await run_in_threadpool(close_clients)


@app.get("/api/v1/health", response_model=HealthStatus)
async def health() -> HealthStatus:
    es_ok, es_message = await run_in_threadpool(ping_elasticsearch)
    mongo_ok, mongo_message = await run_in_threadpool(ping_mongodb)

    overall_status = "ok" if es_ok and mongo_ok else "degraded"

    return HealthStatus(
        status=overall_status,
        elasticsearch=_status_from_tuple(es_ok, es_message),
        mongodb=_status_from_tuple(mongo_ok, mongo_message),
        model=ServiceStatus(status="pending"),
    )


app.include_router(api_router)

