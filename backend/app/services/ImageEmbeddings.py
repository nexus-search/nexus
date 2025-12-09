from transformers import CLIPVisionModelWithProjection, AutoProcessor
from PIL import Image
from torch import Tensor, no_grad
from torch.cuda import is_available as torch_is_available
import config.config as Config
import requests
from io import BytesIO
from os.path import splitext

class ImageEmbeddings:
    def __init__(self, model_name: str = Config.DEFAULT_CLIP_MODEL):
        self.model_name = model_name
        self.processor = AutoProcessor.from_pretrained(model_name)
        self.DEVICE = "cuda" if torch_is_available() else "cpu"
        self.vision_model = CLIPVisionModelWithProjection.from_pretrained(model_name).to(self.DEVICE) # pyright: ignore[reportArgumentType]

    @staticmethod
    def __load_image(image_path :str) -> Image.Image:
        """
        Load an image from a local path or URL.
        Args:
            image_path (str): The local file path or URL of the image.
        Returns:
            Image.Image: The loaded image.
        """
        if not isinstance(image_path, str):
            raise ValueError("Image path must be a string.")
        
        if not splitext(image_path)[-1].lower() in ('.png', '.jpg', '.jpeg', '.bmp', '.gif'):
            raise ValueError("Image path must point to a valid image file.")
        
        if image_path.startswith('http://') or image_path.startswith('https://'):
            response = requests.get(image_path)
            image = Image.open(BytesIO(response.content)).convert("RGB")
        else:
            image = Image.open(image_path).convert("RGB")
        return image

    def get_image_embeddings(self, image: Image.Image) -> Tensor:
        # Preprocess the image inputs
        inputs = self.processor(images=[image], return_tensors="pt").to(self.DEVICE)
        with no_grad():
            embeddings = self.vision_model(**inputs).image_embeds

        # Return the normalized image embeddings
        return  embeddings
    
    def get_images_embeddings_batch(self, images: list[Image.Image]) -> Tensor:
        # Preprocess the batch of images
        inputs = self.processor(images=images, return_tensors="pt").to(self.DEVICE)
        with no_grad():
            embeddings = self.vision_model(**inputs).image_embeds

        # Return the normalized image embeddings
        return  embeddings
    
    def processImages(self, image_paths: list[str]) -> Tensor:
        images = []
        for image_path in image_paths:
            image = self.__load_image(image_path)
            images.append(image)
        
        return self.get_images_embeddings_batch(images)

if __name__ == "__main__":
    image_embeddings = ImageEmbeddings()
    test_image = Image.new('RGB', (224, 224), color='red')
    embeddings = image_embeddings.get_image_embeddings(test_image)
    print(embeddings)