from transformers import CLIPVisionModelWithProjection, AutoProcessor
from PIL import Image
from torch import Tensor, no_grad
from torch.cuda import is_available as cuda_is_available
from app.config import settings
from typing import List, Optional
import requests
from io import BytesIO
from os.path import splitext
import logging

logger = logging.getLogger(__name__)


class ImageEmbeddings:
    _instance: Optional['ImageEmbeddings'] = None
    _initialized: bool = False

    def __new__(cls, model_name: str = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, model_name: str = None):
        if self._initialized:
            return

        if model_name is None:
            model_name = settings.DEFAULT_CLIP_MODEL

        self.model_name = model_name
        self.processor = AutoProcessor.from_pretrained(model_name)
        self.DEVICE = "cuda" if cuda_is_available() else "cpu"
        self.vision_model = CLIPVisionModelWithProjection.from_pretrained(model_name).to(self.DEVICE)
        self.vision_model.eval()
        self._initialized = True
        logger.info(f"ImageEmbeddings initialized with model: {model_name} on {self.DEVICE}")

    @staticmethod
    def __load_image(image_path: str) -> Image.Image:
        """
        Load an image from a local path or URL.
        Args:
            image_path (str): The local file path or URL of the image.
        Returns:
            Image.Image: The loaded image.
        """
        if not isinstance(image_path, str):
            raise ValueError("Image path must be a string.")

        try:
            logger.debug(f"Loading image from: {image_path}")
            if image_path.startswith('http://') or image_path.startswith('https://'):
                response = requests.get(image_path, timeout=10)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).convert("RGB")
            elif splitext(image_path)[-1].lower() in ('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'):
                image = Image.open(image_path).convert("RGB")
            else:
                raise ValueError("Image path must point to a valid image file.")
            return image
        except Exception as e:
            logger.error(f"Failed to load image from {image_path}: {e}")
            raise

    def get_image_embeddings(self, image: Image.Image) -> List[float]:
        """Generate embedding for a single image."""
        try:
            inputs = self.processor(images=[image], return_tensors="pt").to(self.DEVICE)
            with no_grad():
                embeddings = self.vision_model(**inputs).image_embeds
            return embeddings[0].cpu().tolist()
        except Exception as e:
            logger.error(f"Failed to generate image embedding: {e}")
            raise
    
    def get_images_embeddings_batch(self, images: list[Image.Image]) -> List[List[float]]:
        """Generate embeddings for multiple images."""
        try:
            inputs = self.processor(images=images, return_tensors="pt").to(self.DEVICE)
            with no_grad():
                embeddings = self.vision_model(**inputs).image_embeds
            return embeddings.cpu().tolist()
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise
    
    def process_images(self, images_paths: list[str]) -> List[List[float]]:
        """
        Process multiple images from paths/URLs and generate embeddings.
        :param images_paths: List of image paths (local or URLs)
        :return: List of embeddings
        """
        images = []
        for image_path in images_paths:
            image = self.__load_image(image_path)
            images.append(image)

        return self.get_images_embeddings_batch(images)

if __name__ == "__main__":
    import os; print("Executed from :", os.getcwd())
    print("cuda" if cuda_is_available() else "cpu")
    image_embeddings = ImageEmbeddings()
    test_image = Image.new('RGB', (224, 224), color='red')
    embeddings = image_embeddings.get_image_embeddings(test_image)
    print(embeddings)