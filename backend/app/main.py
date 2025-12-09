# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routes import auth
from app.routes import use
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
    app = FastAPI(title="Nexus", lifespan=lifespan)

    # Include routers
    app.include_router(auth.router)
    app.include_router(use.router)

    return app

app = create_app()
