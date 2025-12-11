from torch import Tensor, no_grad
from torch.cuda import is_available as cuda_is_available
from transformers import AutoTokenizer, CLIPTextModelWithProjection
from app.config import settings
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class TextEmbeddings:
    """Class to generate L2 normalized text embeddings using a CLIP text model."""

    _instance: Optional['TextEmbeddings'] = None
    _initialized: bool = False

    def __new__(cls, model_name: str = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, model_name: str = None) -> None:
        if self._initialized:
            return

        if model_name is None:
            model_name = settings.DEFAULT_CLIP_MODEL

        self.DEVICE = "cuda" if cuda_is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.text_model = CLIPTextModelWithProjection.from_pretrained(model_name).to(self.DEVICE)
        self.text_model.eval()
        self._initialized = True
        logger.info(f"TextEmbeddings initialized with model: {model_name} on {self.DEVICE}")

    def get_text_embeddings(self, texts: str) -> List[float]:
        """Generates L2 normalized embedding for a single text query."""
        try:
            inputs = self.tokenizer(texts, padding=True, return_tensors="pt").to(self.DEVICE)
            with no_grad():
                embeddings = self.text_model(**inputs).text_embeds
            return embeddings[0].cpu().tolist()
        except Exception as e:
            logger.error(f"Failed to generate text embedding: {e}")
            raise
    
    def get_texts_embeddings(self, texts: list[str]) -> List[List[float]]:
        """Generates L2 normalized embeddings for multiple text queries."""
        try:
            inputs = self.tokenizer(texts, padding=True, return_tensors="pt").to(self.DEVICE)
            with no_grad():
                embeddings = self.text_model(**inputs).text_embeds
            return embeddings.cpu().tolist()
        except Exception as e:
            logger.error(f"Failed to generate batch text embeddings: {e}")
            raise
    
if __name__ == "__main__":
    import os; print("Executed from :", os.getcwd())
    print("cuda" if cuda_is_available() else "cpu")
    text_embedder = TextEmbeddings()
    test_text = "a red image"
    embeddings = text_embedder.get_text_embeddings(test_text)
    print(embeddings)