"""
Script to update thumbnail URLs for existing images to preserve aspect ratios.
This script regenerates thumbnail URLs using the new transformation (width: 300, crop: scale)
instead of the old square format (width: 300, height: 300, crop: fill).
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import cloudinary


async def update_thumbnail_urls():
    """Update thumbnail URLs for all existing images."""

    # Configure Cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    images_collection = db["images"]

    print("Fetching images with cloudinary_public_id...")

    # Find all images that have a cloudinary_public_id
    cursor = images_collection.find({"cloudinary_public_id": {"$exists": True, "$ne": None}})
    images = await cursor.to_list(length=None)

    print(f"Found {len(images)} images to update")

    updated_count = 0

    for image in images:
        public_id = image.get("cloudinary_public_id")
        if not public_id:
            continue

        # Generate new thumbnail URL with aspect ratio preservation
        new_thumbnail_url = cloudinary.CloudinaryImage(public_id).build_url(
            transformation=[
                {'width': 300, 'crop': 'scale'},
                {'quality': 'auto', 'fetch_format': 'auto'}
            ]
        )

        # Update the document
        result = await images_collection.update_one(
            {"_id": image["_id"]},
            {"$set": {"thumbnail_url": new_thumbnail_url}}
        )

        if result.modified_count > 0:
            updated_count += 1
            print(f"✓ Updated: {image.get('title', 'untitled')} (ID: {image['_id']})")

    print(f"\n✅ Successfully updated {updated_count} thumbnail URLs")

    # Close connection
    client.close()


if __name__ == "__main__":
    print("🔄 Starting thumbnail URL update...\n")
    asyncio.run(update_thumbnail_urls())
    print("\n✨ Done!")
