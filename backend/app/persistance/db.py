import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.image import Image  # our class
from app.models.collection import Collection
from app.models.user import User

load_dotenv()

async def init_db():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("MONGODB_DB", "mydatabase")]  # MongoDB database name
    await init_beanie(database=db, document_models=[Image,Collection,User])

#drop db
async def drop_db():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("MONGODB_DB", "mydatabase")]
    await db.drop_collection(Image)
    await db.drop_collection(Collection)
    await db.drop_collection(User)