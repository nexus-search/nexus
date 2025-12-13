from beanie import Document
from typing import Optional,List
from app.models.collection import Collection

class User(Document):
    username: str
    email: str
    password_hash: str
    collections: Optional[List[Collection]] = None

    class Settings:
        name = "users"  # Collection name in the database