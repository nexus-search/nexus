from beanie import Document, before_event, Insert, Update, after_event, ValidateOnSave
from typing import Optional
from datetime import datetime
from pydantic import Field, field_validator
from app.models.image import Image

class Collection(Document):
    name: str
    description: Optional[str] = None
    images: Optional[list[Image]] = []
    private: Optional[bool] = False
    cover_image_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('created_at', mode='before')
    @classmethod
    def set_default_created_at(cls, v):
        """Ensure created_at has a default value if None."""
        if v is None:
            return datetime.utcnow()
        return v

    @before_event(Insert)
    def set_created_at_on_insert(self):
        """Set created_at timestamp before inserting."""
        if not self.created_at:
            self.created_at = datetime.utcnow()

    @before_event(Update)
    def set_updated_at(self):
        """Set updated_at timestamp before updating."""
        self.updated_at = datetime.utcnow()

    class Settings:
        name = "collections"  # Collection name in the database
        validate_on_save = True