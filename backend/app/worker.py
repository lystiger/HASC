# backend/app/worker.py
import asyncio
import os
import uuid
from pathlib import Path
from typing import List, Tuple
from PIL import Image

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from datetime import datetime

from app.core.config import settings
from app.models.product import Product as DBProduct, ProductStatus
from app.models.task import Task as DBTask, TaskStatus, TaskType
from app.db.base import Base # Import Base for metadata.create_all

# Image processing constants
MAX_WEB_IMAGE_SIZE = (1200, 1200)
THUMBNAIL_SIZE = (300, 300)
WEBP_QUALITY = 85

# Temporary upload directory (must match the one in products.py)
TEMP_UPLOAD_DIR = "backend/temp_uploads"
# Permanent upload directory (from settings)
PERMANENT_UPLOAD_DIR = settings.UPLOAD_DIR

# Ensure permanent upload directory exists
Path(PERMANENT_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Async database engine and session for the worker
engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
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
    img = Image.open(image_path)
    img_name_base = f"product_{product_id}_{uuid.uuid4().hex}"

    # Process web image
    img.thumbnail(MAX_WEB_IMAGE_SIZE, Image.Resampling.LANCZOS)
    web_image_filename = f"{img_name_base}_web.webp"
    web_image_path = Path(PERMANENT_UPLOAD_DIR) / web_image_filename
    img.save(web_image_path, "WEBP", quality=WEBP_QUALITY)

    # Process thumbnail
    img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    thumbnail_filename = f"{img_name_base}_thumb.webp"
    thumbnail_path = Path(PERMANENT_UPLOAD_DIR) / thumbnail_filename
    img.save(thumbnail_path, "WEBP", quality=WEBP_QUALITY)

    # Remove the original raw image after processing
    os.remove(image_path)

    # Return paths relative to the project root or accessible URL paths
    # Assuming UPLOAD_DIR is configured to be served statically
    return f"{PERMANENT_UPLOAD_DIR}/{web_image_filename}", f"{PERMANENT_UPLOAD_DIR}/{thumbnail_filename}"


async def process_image_task(db: AsyncSession, task: DBTask):
    """
    Processes a single image task.
    """
    try:
        task.status = TaskStatus.IN_PROGRESS
        db.add(task)
        await db.commit()
        await db.refresh(task)

        product_id = task.metadata_["product_id"]
        original_image_path = task.metadata_["original_image_path"]
        original_filename = task.metadata_["original_filename"]

        # Ensure the original_image_path exists
        if not os.path.exists(original_image_path):
            raise FileNotFoundError(f"Original image file not found: {original_image_path}")

        web_url, thumb_url = _process_image_file(
            Path(original_image_path), product_id, original_filename
        )

        # Update product's images list
        db_product = await db.get(DBProduct, product_id)
        if db_product:
            if not db_product.images:
                db_product.images = []
            db_product.images.append(
                {"original_name": original_filename, "web_url": web_url, "thumb_url": thumb_url}
            )
            db.add(db_product)
            await db.commit()
            await db.refresh(db_product)
        else:
            raise ValueError(f"Product with ID {product_id} not found.")

        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now()
        task.metadata_["processed_web_url"] = web_url
        task.metadata_["processed_thumb_url"] = thumb_url
        db.add(task)
        await db.commit()
        await db.refresh(task)
        print(f"Task {task.id} (product {product_id}) completed.")

    except Exception as e:
        await db.rollback()
        task.status = TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.now()
        db.add(task)
        await db.commit()
        await db.refresh(task)
        print(f"Task {task.id} (product {task.metadata_.get('product_id')}) failed: {e}")


async def check_and_update_product_status(db: AsyncSession, product_id: int):
    """
    Checks if all image processing tasks for a product are completed or failed,
    and updates the product status accordingly.
    """
    stmt = select(DBTask).where(DBTask.product_id == product_id)
    tasks = (await db.execute(stmt)).scalars().all()

    if not tasks:
        # No tasks found for this product, might be an error or no images were uploaded
        return

    all_tasks_finished = all(task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED] for task in tasks)
    
    if all_tasks_finished:
        db_product = await db.get(DBProduct, product_id)
        if db_product and db_product.status == ProductStatus.DRAFT:
            if all(task.status == TaskStatus.COMPLETED for task in tasks):
                db_product.status = ProductStatus.PUBLISHED
                print(f"Product {product_id} status updated to PUBLISHED.")
            else:
                db_product.status = ProductStatus.FAILED # Or some other status to indicate partial failure
                print(f"Product {product_id} status updated to FAILED due to task failures.")
            db.add(db_product)
            await db.commit()
            await db.refresh(db_product)


async def worker_main():
    """
    Main function for the background worker.
    Continuously polls for pending image processing tasks.
    """
    print("Image processing worker started...")
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
                    print(f"Processing task {task.id} for product {task.metadata_['product_id']}...")
                    await process_image_task(db, task)
                    # After processing, check and update product status
                    await check_and_update_product_status(db, task.metadata_['product_id'])
                else:
                    # print("No pending tasks. Waiting...")
                    pass
            except Exception as e:
                print(f"Worker error: {e}")
                await db.rollback() # Ensure rollback on session if an error occurs

        await asyncio.sleep(settings.WORKER_POLL_INTERVAL) # Poll every X seconds

if __name__ == "__main__":
    # This block is for running the worker standalone for testing/development
    # In a real deployment, this would be managed by a process manager (e.g., systemd, supervisord, docker-compose)
    print("Running worker directly. In production, consider a proper process manager.")
    asyncio.run(worker_main())
