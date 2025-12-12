"""
Application configuration module.
Loads configuration from environment variables with sensible defaults.
"""
import os
from typing import Optional


class Settings:
    """Application settings loaded from environment variables."""

    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_RELOAD: bool = os.getenv("API_RELOAD", "true").lower() == "true"
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    # MongoDB Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "multimedia_search")
    MONGODB_COLLECTION: str = os.getenv("MONGODB_COLLECTION", "media_files")

    # Elasticsearch Configuration
    ELASTICSEARCH_URL: str = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    ELASTICSEARCH_INDEX: str = os.getenv("ELASTICSEARCH_INDEX", "media_embeddings")
    ELASTICSEARCH_USER: str = os.getenv("ELASTICSEARCH_USER", "elastic")
    ELASTICSEARCH_PASSWORD: str = os.getenv("ELASTICSEARCH_PASSWORD", "changeme")

    # AI Model Configuration - CLIP Models
    # CLIP_VIT_BASE_PATCH32: str = 'openai/clip-vit-base-patch32'
    # CLIP_VIT_LARGE_PATCH14: str = 'openai/clip-vit-large-patch14'
    # CLIP_VIT_B32_LAION: str = 'laion/CLIP-ViT-B-32-laion2B-s34B-b79K'
    # CLIP_VIT_B16_LAION: str = 'laion/CLIP-ViT-B-16-laion400m'

    DEFAULT_CLIP_MODEL: str = os.getenv(
        "DEFAULT_CLIP_MODEL",
        'openai/clip-vit-base-patch32'
    )

    AVAILABLE_CLIP_MODELS: list = [
        'openai/clip-vit-base-patch32',
        'openai/clip-vit-large-patch14',
        'laion/CLIP-ViT-B-32-laion2B-s34B-b79K',
        'laion/CLIP-ViT-B-16-laion400m'
    ]

    MODEL_DEVICE: str = os.getenv("MODEL_DEVICE", "cpu")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "./models")

    # File Upload Configuration
    MAX_IMAGE_SIZE: int = int(os.getenv("MAX_IMAGE_SIZE", "10485760"))  # 10MB
    MAX_VIDEO_SIZE: int = int(os.getenv("MAX_VIDEO_SIZE", "52428800"))  # 50MB
    ALLOWED_IMAGE_TYPES: str = os.getenv("ALLOWED_IMAGE_TYPES", "image/jpeg,image/png,image/gif,image/webp")
    ALLOWED_VIDEO_TYPES: str = os.getenv("ALLOWED_VIDEO_TYPES", "video/mp4,video/avi")

    # Search Configuration
    DEFAULT_TOP_K: int = int(os.getenv("DEFAULT_TOP_K", "10"))
    DEFAULT_SIMILARITY_THRESHOLD: float = float(os.getenv("DEFAULT_SIMILARITY_THRESHOLD", "0.5"))

    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # User Storage Configuration
    DEFAULT_USER_QUOTA_GB: int = int(os.getenv("DEFAULT_USER_QUOTA_GB", "1"))

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    @classmethod
    def validate(cls) -> None:
        """Validate critical configuration values."""
        if not cls.JWT_SECRET_KEY:
            raise ValueError(
                "JWT_SECRET_KEY environment variable is not set. "
                "Generate one with: openssl rand -hex 32"
            )

        if cls.JWT_SECRET_KEY == "your-secret-key-here-change-in-production":
            raise ValueError(
                "JWT_SECRET_KEY is set to the default value. "
                "Please change it in production!"
            )

        # Warn about Cloudinary if not configured
        if not cls.CLOUDINARY_CLOUD_NAME or not cls.CLOUDINARY_API_KEY:
            print("⚠️  Warning: Cloudinary credentials not configured. File uploads will fail.")


# Create a singleton settings instance
settings = Settings()
