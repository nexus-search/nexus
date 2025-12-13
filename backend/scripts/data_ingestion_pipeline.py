#!/usr/bin/env python3
"""
Data Ingestion Pipeline for Nexus Search
Downloads images from Roboflow dataset, uploads to Cloudinary,
generates embeddings, and indexes in MongoDB + Elasticsearch.

Usage:
    python scripts/data_ingestion_pipeline.py --dataset-path ./data/animals

Requirements:
    pip install roboflow pillow tqdm
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.image import Image
from app.services.cloudinaryservice import cloudinary_service
from app.elasticsearch.client import ESClient
from app.config import settings
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataIngestionPipeline:
    """Pipeline for ingesting image datasets into Nexus Search."""

    def __init__(
        self,
        dataset_path: str,
        user_id: str = "system",
        batch_size: int = 10,
        skip_cloudinary: bool = False
    ):
        """
        Initialize the data ingestion pipeline.

        Args:
            dataset_path: Path to the dataset directory
            user_id: User ID to assign ownership (default: "system")
            batch_size: Number of images to process in parallel
            skip_cloudinary: Skip Cloudinary upload (for testing)
        """
        self.dataset_path = Path(dataset_path)
        self.user_id = user_id
        self.batch_size = batch_size
        self.skip_cloudinary = skip_cloudinary
        self.es_client = None
        self.stats = {
            'total': 0,
            'processed': 0,
            'uploaded': 0,
            'embedded': 0,
            'indexed': 0,
            'failed': 0,
            'errors': []
        }

    async def initialize(self):
        """Initialize database and Elasticsearch connections."""
        logger.info("Initializing connections...")

        # Initialize MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await init_beanie(
            database=client[settings.MONGODB_DB],
            document_models=[Image]
        )

        # Initialize Elasticsearch
        self.es_client = ESClient()
        await self.es_client.create_index()

        logger.info("✓ Connections initialized")

    async def discover_images(self) -> List[Path]:
        """
        Discover all image files in the dataset directory.

        Returns:
            List of image file paths
        """
        logger.info(f"Discovering images in {self.dataset_path}...")

        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        image_files = []

        for ext in image_extensions:
            image_files.extend(self.dataset_path.rglob(f'*{ext}'))
            image_files.extend(self.dataset_path.rglob(f'*{ext.upper()}'))

        self.stats['total'] = len(image_files)
        logger.info(f"✓ Found {len(image_files)} images")

        return image_files

    async def process_image(
        self,
        image_path: Path,
        tags: Optional[List[str]] = None
    ) -> Optional[Image]:
        """
        Process a single image: upload to Cloudinary, generate embeddings, store in DB.

        Args:
            image_path: Path to the image file
            tags: Optional tags to add to the image

        Returns:
            Image document if successful, None otherwise
        """
        try:
            # Extract metadata from path
            filename = image_path.name
            category = image_path.parent.name  # Assume parent dir is category

            # Build tags
            image_tags = tags or []
            if category and category != self.dataset_path.name:
                image_tags.append(category)

            # Upload to Cloudinary (if not skipped)
            cloudinary_data = None
            if not self.skip_cloudinary:
                try:
                    cloudinary_data = cloudinary_service.upload_image(
                        file_path=str(image_path),
                        user_id=self.user_id,
                        tags=image_tags
                    )
                    self.stats['uploaded'] += 1
                except Exception as e:
                    logger.warning(f"Cloudinary upload failed for {filename}: {e}")
                    # Continue without Cloudinary URLs

            # Generate CLIP embedding
            try:
                image_embedding = Image.generate_image_embedding(str(image_path))
                self.stats['embedded'] += 1
            except Exception as e:
                logger.error(f"Embedding generation failed for {filename}: {e}")
                return None

            # Create Image document
            image_doc = Image(
                title=filename,
                description=f"Animal image from dataset - {category}",
                file_path=str(image_path) if not cloudinary_data else None,
                cloudinary_public_id=cloudinary_data['public_id'] if cloudinary_data else None,
                thumbnail_url=cloudinary_data['thumbnail_url'] if cloudinary_data else None,
                medium_url=cloudinary_data['medium_url'] if cloudinary_data else None,
                file_size=image_path.stat().st_size,
                visibility="public",
                owner_id=self.user_id,
                tags=image_tags,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            # Save to MongoDB
            await image_doc.save()

            # Index in Elasticsearch
            try:
                await self.es_client.index_image(
                    image_id=str(image_doc.id),
                    embedding=image_embedding
                )
                self.stats['indexed'] += 1
            except Exception as e:
                logger.warning(f"Elasticsearch indexing failed for {filename}: {e}")
                # Continue - we still have MongoDB record

            self.stats['processed'] += 1
            return image_doc

        except Exception as e:
            self.stats['failed'] += 1
            self.stats['errors'].append({
                'file': str(image_path),
                'error': str(e)
            })
            logger.error(f"Failed to process {image_path}: {e}")
            return None

    async def process_batch(self, image_paths: List[Path]) -> List[Image]:
        """
        Process a batch of images concurrently.

        Args:
            image_paths: List of image paths to process

        Returns:
            List of successfully processed Image documents
        """
        tasks = [self.process_image(path) for path in image_paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out None and exceptions
        successful = [r for r in results if isinstance(r, Image)]
        return successful

    async def run(self):
        """Run the complete data ingestion pipeline."""
        logger.info("=" * 60)
        logger.info("Starting Data Ingestion Pipeline")
        logger.info("=" * 60)

        # Initialize connections
        await self.initialize()

        # Discover images
        image_files = await self.discover_images()
        if not image_files:
            logger.error("No images found!")
            return

        # Process images in batches
        logger.info(f"Processing {len(image_files)} images in batches of {self.batch_size}...")

        with tqdm(total=len(image_files), desc="Processing images") as pbar:
            for i in range(0, len(image_files), self.batch_size):
                batch = image_files[i:i + self.batch_size]
                await self.process_batch(batch)
                pbar.update(len(batch))

        # Print final statistics
        self.print_stats()

    def print_stats(self):
        """Print pipeline execution statistics."""
        logger.info("=" * 60)
        logger.info("Pipeline Execution Complete")
        logger.info("=" * 60)
        logger.info(f"Total images found:    {self.stats['total']}")
        logger.info(f"Successfully processed: {self.stats['processed']}")
        logger.info(f"Uploaded to Cloudinary: {self.stats['uploaded']}")
        logger.info(f"Embeddings generated:   {self.stats['embedded']}")
        logger.info(f"Indexed in ES:         {self.stats['indexed']}")
        logger.info(f"Failed:                {self.stats['failed']}")

        if self.stats['errors']:
            logger.warning(f"\n{len(self.stats['errors'])} errors occurred:")
            for error in self.stats['errors'][:10]:  # Show first 10
                logger.warning(f"  {error['file']}: {error['error']}")
            if len(self.stats['errors']) > 10:
                logger.warning(f"  ... and {len(self.stats['errors']) - 10} more")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Ingest image dataset into Nexus Search"
    )
    parser.add_argument(
        '--dataset-path',
        required=True,
        help='Path to the dataset directory'
    )
    parser.add_argument(
        '--user-id',
        default='system',
        help='User ID to assign ownership (default: system)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=10,
        help='Number of images to process in parallel (default: 10)'
    )
    parser.add_argument(
        '--skip-cloudinary',
        action='store_true',
        help='Skip Cloudinary upload (for testing)'
    )

    args = parser.parse_args()

    # Validate dataset path
    dataset_path = Path(args.dataset_path)
    if not dataset_path.exists():
        logger.error(f"Dataset path does not exist: {dataset_path}")
        sys.exit(1)

    # Run pipeline
    pipeline = DataIngestionPipeline(
        dataset_path=str(dataset_path),
        user_id=args.user_id,
        batch_size=args.batch_size,
        skip_cloudinary=args.skip_cloudinary
    )

    await pipeline.run()


if __name__ == "__main__":
    asyncio.run(main())
