from torch import Tensor, no_grad
from torch.cuda import is_available as cuda_is_available
from transformers import AutoTokenizer, CLIPTextModelWithProjection
from app.config import config as Config

class TextEmbeddings:
    """Class to generate
    L2 normalized text embeddings using a CLIP text model.
    """
    def __init__(self,model_name :str = Config.DEFAULT_CLIP_MODEL) -> None:
        self.DEVICE = "cuda" if cuda_is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.text_model = CLIPTextModelWithProjection.from_pretrained(model_name,).to(self.DEVICE) # pyright: ignore[reportArgumentType]

    def get_text_embeddings(self, texts: str) -> Tensor:
        """Generates L2 normalized embeddings for a list of text queries."""
        inputs = self.tokenizer(texts, padding=True, return_tensors="pt").to(self.DEVICE)
        with no_grad():
            # text_embeds are already normalized in this class's output
            embeddings = self.text_model(**inputs).text_embeds 
        return embeddings
    
    def get_texts_embeddings(self, texts: list[str]) -> Tensor:
        """Generates L2 normalized embeddings for a list of text queries."""
        inputs = self.tokenizer(texts, padding=True, return_tensors="pt").to(self.DEVICE)
        with no_grad():
            # text_embeds are already normalized in this class's output
            embeddings = self.text_model(**inputs).text_embeds 
        return embeddings
    
if __name__ == "__main__":
    import os; print("Executed from :", os.getcwd())
    print("cuda" if cuda_is_available() else "cpu")
    text_embedder = TextEmbeddings()
    test_text = "a red image"
    embeddings = text_embedder.get_text_embeddings(test_text)
    print(embeddings)