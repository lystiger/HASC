import os
import uuid
from pathlib import Path
from typing import List, Tuple
from PIL import Image

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.product import Product as DBProduct, ProductStatus


# Image processing constants
MAX_WEB_IMAGE_SIZE = (1200, 1200)
THUMBNAIL_SIZE = (300, 300)
WEBP_QUALITY = 85


def _save_image_to_disk(image_data: bytes, filename: str) -> Path:
    """Saves image data to disk and returns the full path."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename
    with open(file_path, "wb") as buffer:
        buffer.write(image_data)
    return file_path


def _process_image(
    image_path: Path, product_id: int, original_filename: str
) -> Tuple[str, str]:
    """Processes an image: resizes, converts to WebP, and creates a thumbnail.
    Returns relative paths to webp and thumbnail images.
    """
    img = Image.open(image_path)
    img_name_base = f"product_{product_id}_{uuid.uuid4().hex}"

    # Process web image
    img.thumbnail(MAX_WEB_IMAGE_SIZE, Image.Resampling.LANCZOS)
    web_image_filename = f"{img_name_base}_web.webp"
    web_image_path = Path(settings.UPLOAD_DIR) / web_image_filename
    img.save(web_image_path, "WEBP", quality=WEBP_QUALITY)

    # Process thumbnail
    img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    thumbnail_filename = f"{img_name_base}_thumb.webp"
    thumbnail_path = Path(settings.UPLOAD_DIR) / thumbnail_filename
    img.save(thumbnail_path, "WEBP", quality=WEBP_QUALITY)

    # Remove the original raw image after processing
    os.remove(image_path)

    # Return relative paths
    return f"{settings.UPLOAD_DIR}/{web_image_filename}", f"{settings.UPLOAD_DIR}/{thumbnail_filename}"


async def process_images_async(
    product_id: int, image_files: List[bytes], original_filenames: List[str], db: AsyncSession
) -> None:
    """Simulates asynchronous image processing for a product.
    For now, directly processes images and updates DB.
    """
    db_product = await db.get(DBProduct, product_id)
    if not db_product:
        # Log error: Product not found, cannot process images
        print(f"Error: Product with ID {product_id} not found for image processing.")
        return

    processed_image_urls = []
    for i, image_data in enumerate(image_files):
        original_filename = original_filenames[i]
        
        # Save original image data to a temporary file
        temp_filename = f"temp_original_{uuid.uuid4().hex}_{original_filename}"
        temp_file_path = _save_image_to_disk(image_data, temp_filename)

        web_url, thumb_url = _process_image(temp_file_path, product_id, original_filename)
        processed_image_urls.append({"original_name": original_filename, "web_url": web_url, "thumb_url": thumb_url})

    db_product.images = processed_image_urls
    db_product.status = ProductStatus.PUBLISHED

    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    print(f"Product {product_id} images processed and status updated to PUBLISHED.")
