#!/usr/bin/env python3
"""
Download dataset from Roboflow Universe.

This script downloads the Animals dataset from Roboflow and prepares it
for ingestion into Nexus Search.

Usage:
    python scripts/download_roboflow_dataset.py --output-dir ./data/animals

Requirements:
    pip install roboflow
"""

import argparse
import logging
from pathlib import Path
from roboflow import Roboflow

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def download_dataset(
    api_key: str,
    workspace: str,
    project: str,
    version: int,
    output_dir: str,
    format: str = "folder"
):
    """
    Download dataset from Roboflow.

    Args:
        api_key: Roboflow API key
        workspace: Workspace name (e.g., "yuga-pwtql")
        project: Project name (e.g., "animals-eujgm")
        version: Dataset version number
        output_dir: Directory to save the dataset
        format: Download format (folder, coco, yolo, etc.)
    """
    logger.info("=" * 60)
    logger.info("Downloading Roboflow Dataset")
    logger.info("=" * 60)
    logger.info(f"Workspace: {workspace}")
    logger.info(f"Project: {project}")
    logger.info(f"Version: {version}")
    logger.info(f"Output: {output_dir}")
    logger.info(f"Format: {format}")
    logger.info("=" * 60)

    # Initialize Roboflow
    rf = Roboflow(api_key=api_key)

    # Get project
    project_obj = rf.workspace(workspace).project(project)
    dataset = project_obj.version(version)

    # Download dataset
    logger.info("Downloading dataset...")
    
    dataset.download(
        format,
        location=output_dir,
        overwrite=True  # Force fresh download
    )

    logger.info("✓ Download complete!")
    
    # Check both the specified output_dir and common subdirectories
    paths_to_check = [
        Path(output_dir),
        Path(output_dir) / f"{project}-{version}",
    ]
    
    found_files = False
    for check_path in paths_to_check:
        if check_path is None or not check_path.exists():
            continue
            
        logger.info(f"\nChecking: {check_path}")
        image_count = len(list(check_path.rglob("*.jpg"))) + \
                     len(list(check_path.rglob("*.png"))) + \
                     len(list(check_path.rglob("*.jpeg")))
        
        json_count = len(list(check_path.rglob("*.json")))
        xml_count = len(list(check_path.rglob("*.xml")))
        
        logger.info(f"  Images: {image_count}")
        logger.info(f"  JSON annotations: {json_count}")
        logger.info(f"  XML annotations: {xml_count}")
        
        if image_count > 0:
            found_files = True
            logger.info(f"✓ Dataset found with {image_count} images!")
            
            # Show directory structure
            logger.info("\nDirectory contents:")
            for item in sorted(check_path.iterdir())[:10]:
                logger.info(f"  - {item.name}")
    
    if not found_files:
        logger.warning("⚠ No images found in expected locations")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Download dataset from Roboflow Universe"
    )
    parser.add_argument(
        '--api-key',
        required=True,
        help='Roboflow API key (get from https://app.roboflow.com/settings/api)'
    )
    parser.add_argument(
        '--workspace',
        default='yuga-pwtql',
        help='Roboflow workspace name (default: yuga-pwtql)'
    )
    parser.add_argument(
        '--project',
        default='animals-eujgm',
        help='Roboflow project name (default: animals-eujgm)'
    )
    parser.add_argument(
        '--version',
        type=int,
        default=1,
        help='Dataset version number (default: 1)'
    )
    parser.add_argument(
        '--output-dir',
        default='./data/animals',
        help='Directory to save the dataset (default: ./data/animals)'
    )
    parser.add_argument(
        '--format',
        default='coco',
        choices=['coco', 'yolov8', 'yolov5pytorch', 'voc', 'tensorflow', 'clip'],
        help='Download format (default: coco)'
    )

    args = parser.parse_args()

    # Create output directory
    Path(args.output_dir).mkdir(parents=True, exist_ok=True)

    # Download dataset
    try:
        download_dataset(
            api_key=args.api_key,
            workspace=args.workspace,
            project=args.project,
            version=args.version,
            output_dir=args.output_dir,
            format=args.format
        )
    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        raise


if __name__ == "__main__":
    main()
