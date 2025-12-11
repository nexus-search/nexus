# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routes import auth, use, media, collections
from app.persistance.db import init_db
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    print("🚀 Starting Nexus Search API...")

    # Validate critical configuration
    try:
        settings.validate()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        raise

    await init_db()
    print("✅ Database initialized")
    print(f"✅ API running at http://{settings.API_HOST}:{settings.API_PORT}")
    print(f"✅ Frontend origin: {settings.FRONTEND_ORIGIN}")

    yield

    # Shutdown code (if needed)
    print("👋 Server is shutting down...")

def create_app() -> FastAPI:
    app = FastAPI(
        title="Nexus Search API",
        description="AI-powered animal discovery platform with multimodal search",
        version="0.1.0",
        lifespan=lifespan
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_ORIGIN],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers with /api/v1 prefix
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(use.router, prefix="/api/v1")
    app.include_router(media.router, prefix="/api/v1")
    app.include_router(collections.router, prefix="/api/v1")

    return app

app = create_app()
