# backend/app/worker.py
import asyncio
import os
import uuid
from pathlib import Path
from typing import List, Tuple
from PIL import Image
import logging # Import logging

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime

from app.core.config import settings
from app.models.product import Product as DBProduct, ProductStatus
from app.models.task import Task as DBTask, TaskStatus, TaskType
from app.db.base import Base # Import Base for metadata.create_all

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Image processing constants
MAX_WEB_IMAGE_SIZE = (1200, 1200)
THUMBNAIL_SIZE = (300, 300)
WEBP_QUALITY = 85

# Temporary upload directory (must match the one in products.py)
TEMP_UPLOAD_DIR = settings.TEMP_UPLOAD_DIR
# Permanent upload directory (from settings)
PERMANENT_UPLOAD_DIR = settings.UPLOAD_DIR

# Ensure upload directories exist
Path(PERMANENT_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(TEMP_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Async database engine and session for the worker
engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

def _process_image_file(
    image_path: Path, product_id: int, original_filename: str
) -> Tuple[str, str]:
    """Processes an image: resizes, converts to WebP, and creates a thumbnail.
    Returns relative paths to webp and thumbnail images.
    """
    logger.info(f"Processing image file: {image_path} for product {product_id}")
    img = Image.open(image_path)
    img_name_base = f"product_{product_id}_{uuid.uuid4().hex}"

    # Process web image
    img.thumbnail(MAX_WEB_IMAGE_SIZE, Image.Resampling.LANCZOS)
    web_image_filename = f"{img_name_base}_web.webp"
    web_image_path = Path(PERMANENT_UPLOAD_DIR) / web_image_filename
    img.save(web_image_path, "WEBP", quality=WEBP_QUALITY)
    logger.info(f"Saved web image to: {web_image_path}")

    # Process thumbnail
    img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    thumbnail_filename = f"{img_name_base}_thumb.webp"
    thumbnail_path = Path(PERMANENT_UPLOAD_DIR) / thumbnail_filename
    img.save(thumbnail_path, "WEBP", quality=WEBP_QUALITY)
    logger.info(f"Saved thumbnail to: {thumbnail_path}")

    # Remove the original raw image after processing
    os.remove(image_path)
    logger.info(f"Removed original image: {image_path}")

    # Return public URL paths served by FastAPI static mount
    return f"/uploads/{web_image_filename}", f"/uploads/{thumbnail_filename}"


async def process_image_task(db: AsyncSession, task: DBTask):
    """
    Processes a single image task.
    """
    logger.info(f"Starting process_image_task for task {task.id}, product {task.metadata_['product_id']}")
    try:
        task.status = TaskStatus.IN_PROGRESS
        task.attempts = (task.attempts or 0) + 1
        db.add(task)
        await db.commit()
        await db.refresh(task)
        logger.info(f"Task {task.id} status set to IN_PROGRESS.")

        product_id = task.metadata_["product_id"]
        original_image_path = task.metadata_["original_image_path"]
        original_filename = task.metadata_["original_filename"]
        logger.info(f"Task {task.id}: product_id={product_id}, original_image_path={original_image_path}, original_filename={original_filename}")

        # Ensure the original_image_path exists
        if not os.path.exists(original_image_path):
            logger.error(f"Task {task.id}: Original image file not found: {original_image_path}")
            raise FileNotFoundError(f"Original image file not found: {original_image_path}")
        logger.info(f"Task {task.id}: Original image file exists at {original_image_path}")

        web_url, thumb_url = _process_image_file(
            Path(original_image_path), product_id, original_filename
        )
        logger.info(f"Task {task.id}: Image processed. Web URL: {web_url}, Thumb URL: {thumb_url}")

        # Update product's images list
        db_product = await db.get(DBProduct, product_id)
        if db_product:
            current_images = list(db_product.images or [])
            current_images.append(
                {"original_name": original_filename, "web_url": web_url, "thumb_url": thumb_url}
            )
            db_product.images = current_images
            flag_modified(db_product, "images")
            db.add(db_product)
            await db.commit()
            await db.refresh(db_product)
            logger.info(f"Task {task.id}: Product {product_id} images updated.")
        else:
            logger.error(f"Task {task.id}: Product with ID {product_id} not found when updating images.")
            raise ValueError(f"Product with ID {product_id} not found.")

        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now()
        task.metadata_["processed_web_url"] = web_url
        task.metadata_["processed_thumb_url"] = thumb_url
        db.add(task)
        await db.commit()
        await db.refresh(task)
        logger.info(f"Task {task.id} (product {product_id}) completed successfully.")

    except Exception as e:
        logger.error(f"Task {task.id} (product {task.metadata_.get('product_id', 'N/A')}) failed with exception: {e}", exc_info=True)
        await db.rollback()
        task.error_message = str(e)
        if task.attempts < task.max_attempts:
            task.status = TaskStatus.PENDING
            logger.info(
                f"Task {task.id} (product {task.metadata_.get('product_id', 'N/A')}) re-queued "
                f"for retry {task.attempts}/{task.max_attempts}."
            )
        else:
            task.status = TaskStatus.FAILED
            task.completed_at = datetime.now()
            logger.info(
                f"Task {task.id} (product {task.metadata_.get('product_id', 'N/A')}) "
                "status set to FAILED (max attempts reached)."
            )
        db.add(task)
        await db.commit()
        await db.refresh(task)


async def check_and_update_product_status(db: AsyncSession, product_id: int):
    """
    Checks if all image processing tasks for a product are completed or failed,
    and updates the product status accordingly.
    """
    logger.info(f"Checking and updating product status for product {product_id}.")
    stmt = select(DBTask).where(DBTask.product_id == product_id)
    tasks = (await db.execute(stmt)).scalars().all()

    if not tasks:
        logger.warning(f"No tasks found for product {product_id}. Skipping status update.")
        return

    all_tasks_finished = all(task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED] for task in tasks)
    
    if all_tasks_finished:
        db_product = await db.get(DBProduct, product_id)
        if db_product and db_product.status == ProductStatus.DRAFT:
            if all(task.status == TaskStatus.COMPLETED for task in tasks):
                db_product.status = ProductStatus.PUBLISHED
                logger.info(f"Product {product_id} status updated to PUBLISHED as all tasks completed.")
            else:
                db_product.status = ProductStatus.FAILED
                logger.warning(f"Product {product_id} status updated to FAILED due to one or more task failures.")
            db.add(db_product)
            await db.commit()
            await db.refresh(db_product)
        else:
            logger.info(f"Product {product_id} status not updated from DRAFT. Current product status: {db_product.status if db_product else 'N/A'}")


async def worker_main():
    """
    Main function for the background worker.
    Continuously polls for pending image processing tasks.
    """
    logger.info("Image processing worker started...")
    while True:
        async with AsyncSessionLocal() as db:
            try:
                # Select one pending IMAGE_PROCESSING task
                stmt = select(DBTask).where(
                    DBTask.status == TaskStatus.PENDING,
                    DBTask.task_type == TaskType.IMAGE_PROCESSING
                ).limit(1)
                result = await db.execute(stmt)
                task = result.scalars().first()

                if task:
                    logger.info(f"Worker found pending task {task.id} for product {task.metadata_['product_id']}...")
                    await process_image_task(db, task)
                    # After processing, check and update product status
                    await check_and_update_product_status(db, task.metadata_['product_id'])
                else:
                    logger.debug("No pending tasks. Waiting...") # Changed to debug level
            except Exception as e:
                logger.error(f"Worker main loop error: {e}", exc_info=True)
                await db.rollback() # Ensure rollback on session if an error occurs

        await asyncio.sleep(settings.WORKER_POLL_INTERVAL) # Poll every X seconds

if __name__ == "__main__":
    # This block is for running the worker standalone for testing/development
    # In a real deployment, this would be managed by a process manager (e.g., systemd, supervisord, docker-compose)
    logger.info("Running worker directly. In production, consider a proper process manager.")
    asyncio.run(worker_main())
