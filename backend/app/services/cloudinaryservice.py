"""
Cloudinary service for image upload, transformation, and management.
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Dict, Any, List
from app.config import settings


class CloudinaryService:
    """Service for managing media files on Cloudinary."""

    def __init__(self):
        """Initialize Cloudinary with credentials from settings."""
        if not all([
            settings.CLOUDINARY_CLOUD_NAME,
            settings.CLOUDINARY_API_KEY,
            settings.CLOUDINARY_API_SECRET
        ]):
            raise ValueError(
                "Cloudinary credentials not configured. "
                "Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
            )

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )

    def upload_image(
        self,
        file_path: str,
        user_id: str,
        public_id: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Upload an image to Cloudinary.

        Args:
            file_path: Path to the image file or file-like object
            user_id: User ID for organizing uploads
            public_id: Optional custom public ID (default: auto-generated)
            tags: Optional list of tags for the image

        Returns:
            Dictionary containing upload result with URLs and metadata

        Example response:
            {
                'public_id': 'nexus/user123/abc123',
                'url': 'https://res.cloudinary.com/...',
                'secure_url': 'https://res.cloudinary.com/...',
                'thumbnail_url': 'https://res.cloudinary.com/.../w_300,c_scale/...',
                'width': 1920,
                'height': 1080,
                'format': 'jpg',
                'resource_type': 'image',
                'bytes': 245678
            }
        """
        # Build folder structure: nexus/{user_id}/
        folder = f"nexus/{user_id}"

        # Prepare upload options
        upload_options = {
            "folder": folder,
            "resource_type": "image",
            "overwrite": False,
            "unique_filename": True,
            "use_filename": True,
            "transformation": [
                {"quality": "auto", "fetch_format": "auto"}
            ]
        }

        if public_id:
            upload_options["public_id"] = public_id

        if tags:
            upload_options["tags"] = tags

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(file_path, **upload_options)

        # Generate thumbnail URL (width: 300px, height: auto to preserve aspect ratio)
        thumbnail_url = cloudinary.CloudinaryImage(result['public_id']).build_url(
            transformation=[
                {'width': 300, 'crop': 'scale'},
                {'quality': 'auto', 'fetch_format': 'auto'}
            ]
        )

        # Generate medium-sized URL (800x800 for viewer)
        medium_url = cloudinary.CloudinaryImage(result['public_id']).build_url(
            transformation=[
                {'width': 800, 'height': 800, 'crop': 'limit'},
                {'quality': 'auto:good', 'fetch_format': 'auto'}
            ]
        )

        return {
            'public_id': result['public_id'],
            'url': result['secure_url'],
            'secure_url': result['secure_url'],
            'thumbnail_url': thumbnail_url,
            'medium_url': medium_url,
            'width': result.get('width'),
            'height': result.get('height'),
            'format': result.get('format'),
            'resource_type': result.get('resource_type'),
            'bytes': result.get('bytes'),
            'created_at': result.get('created_at')
        }

    def delete_image(self, public_id: str) -> Dict[str, Any]:
        """
        Delete an image from Cloudinary.

        Args:
            public_id: The public ID of the image to delete

        Returns:
            Dictionary containing deletion result
        """
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        return result

    def get_image_info(self, public_id: str) -> Dict[str, Any]:
        """
        Get information about an image on Cloudinary.

        Args:
            public_id: The public ID of the image

        Returns:
            Dictionary containing image metadata
        """
        result = cloudinary.api.resource(public_id, resource_type="image")
        return result

    def generate_url(
        self,
        public_id: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        crop: str = "limit",
        quality: str = "auto"
    ) -> str:
        """
        Generate a transformed URL for an image.

        Args:
            public_id: The public ID of the image
            width: Optional target width
            height: Optional target height
            crop: Crop mode (fill, fit, limit, etc.)
            quality: Quality setting (auto, auto:good, etc.)

        Returns:
            Transformed image URL
        """
        transformation = [{'quality': quality, 'fetch_format': 'auto'}]

        if width or height:
            size_transform = {'crop': crop}
            if width:
                size_transform['width'] = width
            if height:
                size_transform['height'] = height
            transformation.insert(0, size_transform)

        return cloudinary.CloudinaryImage(public_id).build_url(
            transformation=transformation
        )

    def list_user_images(
        self,
        user_id: str,
        max_results: int = 100,
        next_cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List all images for a specific user.

        Args:
            user_id: The user ID
            max_results: Maximum number of results to return
            next_cursor: Pagination cursor for next page

        Returns:
            Dictionary with resources list and next_cursor
        """
        prefix = f"nexus/{user_id}/"
        result = cloudinary.api.resources(
            type="upload",
            resource_type="image",
            prefix=prefix,
            max_results=max_results,
            next_cursor=next_cursor
        )
        return result

    def update_tags(self, public_id: str, tags: List[str]) -> Dict[str, Any]:
        """
        Update tags for an image.

        Args:
            public_id: The public ID of the image
            tags: List of tags to set

        Returns:
            Dictionary containing update result
        """
        result = cloudinary.uploader.add_tag(tags, [public_id])
        return result


# Create a singleton instance
cloudinary_service = CloudinaryService()
