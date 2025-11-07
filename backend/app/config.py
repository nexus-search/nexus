from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="backend/.env",
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    # API
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    api_reload: bool = Field(default=True, alias="API_RELOAD")
    frontend_origin: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGIN")

    # MongoDB
    mongodb_url: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URL")
    mongodb_db: str = Field(default="multimedia_search", alias="MONGODB_DB")
    mongodb_collection: str = Field(default="media_files", alias="MONGODB_COLLECTION")

    # Elasticsearch
    elasticsearch_url: str = Field(default="http://localhost:9200", alias="ELASTICSEARCH_URL")
    elasticsearch_index: str = Field(default="media_embeddings", alias="ELASTICSEARCH_INDEX")
    elasticsearch_username: str = Field(default="elastic", alias="ELASTICSEARCH_USERNAME")
    elasticsearch_password: str = Field(default="changeme", alias="ELASTICSEARCH_PASSWORD")

    # AI Model
    model_name: str = Field(default="clip-ViT-B-32", alias="MODEL_NAME")
    model_device: str = Field(default="cpu", alias="MODEL_DEVICE")
    model_cache_dir: str = Field(default="./models", alias="MODEL_CACHE_DIR")

    # Uploads
    max_image_size: int = Field(default=10_485_760, alias="MAX_IMAGE_SIZE")
    max_video_size: int = Field(default=52_428_800, alias="MAX_VIDEO_SIZE")
    allowed_image_types: str = Field(default="image/jpeg,image/png", alias="ALLOWED_IMAGE_TYPES")
    allowed_video_types: str = Field(default="video/mp4,video/avi", alias="ALLOWED_VIDEO_TYPES")

    # Search
    default_top_k: int = Field(default=10, alias="DEFAULT_TOP_K")
    default_similarity_threshold: float = Field(default=0.5, alias="DEFAULT_SIMILARITY_THRESHOLD")

    # JWT Authentication
    jwt_secret_key: str = Field(default="our-secret-key-here-change-in-production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # User Storage
    default_user_quota_gb: int = Field(default=1, alias="DEFAULT_USER_QUOTA_GB")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

