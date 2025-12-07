# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routes import auth
from app.persistance.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    await init_db()
    print("Database initialized ✅")
    yield
    # Shutdown code (if needed)
    print("Server is shutting down...")

def create_app() -> FastAPI:
    app = FastAPI(title="JWT Auth Example", lifespan=lifespan)

    # Include routers
    app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

    return app

app = create_app()
