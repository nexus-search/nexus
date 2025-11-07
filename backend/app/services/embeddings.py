from __future__ import annotations

import logging
from io import BytesIO
from typing import Optional

import numpy as np
from PIL import Image
from sentence_transformers import SentenceTransformer

from app.config import get_settings

logger = logging.getLogger(__name__)

_model: Optional[SentenceTransformer] = None
_settings = get_settings()


def get_embedding_model() -> SentenceTransformer:
    """Get or load the CLIP embedding model (lazy loading)."""
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {_settings.model_name}")
        _model = SentenceTransformer(
            _settings.model_name,
            device=_settings.model_device,
            cache_folder=_settings.model_cache_dir,
        )
        logger.info("Embedding model loaded successfully")
    return _model


def extract_image_embedding(image_data: bytes) -> np.ndarray:
    """Extract embedding from image bytes."""
    try:
        # Load image from bytes
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed (handles RGBA, L, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Get model and encode
        model = get_embedding_model()
        embedding = model.encode(image, convert_to_numpy=True)
        
        # Ensure it's the right shape (512 for CLIP ViT-B-32)
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
        
        return embedding[0]  # Return as 1D array
    
    except Exception as e:
        logger.error(f"Error extracting image embedding: {e}", exc_info=True)
        raise


def extract_text_embedding(text: str) -> np.ndarray:
    """Extract embedding from text (for text-to-image search)."""
    try:
        model = get_embedding_model()
        embedding = model.encode(text, convert_to_numpy=True)
        
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
        
        return embedding[0]
    
    except Exception as e:
        logger.error(f"Error extracting text embedding: {e}", exc_info=True)
        raise


def normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    """Normalize embedding vector for cosine similarity."""
    norm = np.linalg.norm(embedding)
    if norm == 0:
        return embedding
    return embedding / norm

