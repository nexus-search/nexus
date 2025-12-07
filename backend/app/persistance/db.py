from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.image import Image  # our class
from app.models.collection import Collection
from app.models.user import User

async def init_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["mydatabase"]  # MongoDB database name
    await init_beanie(database=db, document_models=[Image,Collection,User])
