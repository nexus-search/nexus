from beanie import Document
from typing import Optional,List

class User(Document):
    username: str
    email: str
    password_hash: str
    collections: Optional[List[str]] = None

    class Settings:
        name = "users"  # Collection name in the database