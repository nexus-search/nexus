import pytest
import tempfile
import os
from PIL import Image as PILImage

from app.services.imageservice import ImageService
from app.services.searchservice import SearchService

@pytest.mark.asyncio
async def test_full_workflow():
    # Step 1: Create and save image to MongoDB + ES
    service = ImageService()
    img = await service.create_image("Test Cat", "A cute cat image", "/uploads/cat.png")
    assert img.title == "Test Cat"
    print("Image created and indexed in ES")

    # Step 2: Search by text
    search_service = SearchService()
    results = await search_service.search_by_text("cat", top_k=5)
    assert len(results) > 0
    assert results[0]['title'] == "Test Cat"
    print("Text search successful")

    # Step 3: Search by image
    # Create a dummy image
    dummy_img = PILImage.new('RGB', (100, 100), color='blue')
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
        dummy_img.save(temp_file.name)
        temp_path = temp_file.name
    
    try:
        with open(temp_path, 'rb') as f:
            image_data = f.read()
        results = await search_service.search_by_image(image_data, top_k=5)
        assert len(results) > 0
        print("Image search successful")
    finally:
        os.unlink(temp_path)

    # Cleanup
    await service.delete_image(str(img.id))
    print("Workflow test completed successfully")
