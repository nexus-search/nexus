from beanie import Document
from typing import Optional

class Image(Document):
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None

    class Settings:
        name = "images" # Collection name in the database   
