import pytest

from app.models.category import Category as DBCategory
from app.models.product import Product as DBProduct, ProductStatus
from app.models.task import Task as DBTask, TaskStatus, TaskType
from app.worker import process_image_task


@pytest.mark.asyncio
async def test_task_retries_then_fails(db_session):
    # Seed category + product
    category = DBCategory(name="PACKAGING")
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)

    product = DBProduct(
        sku="RETRY-TEST-001",
        name="Retry Test Product",
        category_id=category.id,
        status=ProductStatus.DRAFT,
        images=[],
        specific_attributes={},
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    # Create task with a missing file to force failure
    task = DBTask(
        product_id=product.id,
        task_type=TaskType.IMAGE_PROCESSING,
        status=TaskStatus.PENDING,
        attempts=0,
        max_attempts=2,
        metadata_={
            "product_id": product.id,
            "original_image_path": "/path/does/not/exist.png",
            "original_filename": "missing.png",
            "content_type": "image/png",
        },
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    # First attempt should requeue
    await process_image_task(db_session, task)
    await db_session.refresh(task)
    assert task.attempts == 1
    assert task.status == TaskStatus.PENDING
    assert task.error_message

    # Second attempt should mark FAILED
    await process_image_task(db_session, task)
    await db_session.refresh(task)
    assert task.attempts == 2
    assert task.status == TaskStatus.FAILED
