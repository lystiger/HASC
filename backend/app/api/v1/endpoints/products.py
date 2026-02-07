from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import json
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
import os
from sqlalchemy.exc import IntegrityError
from asyncpg.exceptions import UniqueViolationError # Import UniqueViolationError

from app.db.session import AsyncSessionLocal
from app.schemas.product import ProductCreate, Product, ProductStatus, ProductUpdate
from app.core.config import settings
from app.models.category import Category as DBCategory
from app.models.product import Product as DBProduct # Keep this import for the DBProduct instance
from app.api.deps import get_db, get_current_user, get_current_admin_user, get_optional_user
from app.models.user import User
from app.models.user import UserRole
from app.models.task import Task as DBTask, TaskStatus, TaskType
from app.schemas.task import TaskCreate as TaskSchemaCreate

router = APIRouter()

# Define a temporary directory for raw image uploads
TEMP_UPLOAD_DIR = settings.TEMP_UPLOAD_DIR
# Ensure the temporary upload directory exists
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_202_ACCEPTED)
async def create_product(
    sku: str = Form(...),
    name: Optional[str] = Form(None),
    name_en: Optional[str] = Form(None),
    name_vi: Optional[str] = Form(None),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    description_en: Optional[str] = Form(None),
    description_vi: Optional[str] = Form(None),
    specific_attributes: str = Form("{}"), # JSON string
    images: List[UploadFile] = File([]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    category_result = await db.execute(
        select(DBCategory).where(DBCategory.code == category)
    )
    db_category = category_result.scalars().first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. '{category}' does not exist.",
        )

    # Normalize bilingual fields (fallback to legacy name/description if provided)
    normalized_name_en = (name_en or name or "").strip()
    normalized_name_vi = (name_vi or name or "").strip()
    normalized_description_en = (description_en or description or "").strip()
    normalized_description_vi = (description_vi or description or "").strip()
    if not normalized_name_en or not normalized_name_vi:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both English and Vietnamese names are required.",
        )
    if not normalized_description_en or not normalized_description_vi:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both English and Vietnamese descriptions are required.",
        )

    # Parse specific_attributes from JSON string
    try:
        parsed_specific_attributes = json.loads(specific_attributes)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specific attributes must be a valid JSON string."
        )

    product_in = ProductCreate(
        sku=sku,
        name=normalized_name_en,
        description=normalized_description_en,
        name_en=normalized_name_en,
        name_vi=normalized_name_vi,
        description_en=normalized_description_en,
        description_vi=normalized_description_vi,
        category=category,
        specific_attributes=parsed_specific_attributes,
        images=[] # Images will be handled by async process
    )

    db_product = DBProduct(
        **product_in.model_dump(exclude={"category"}), # Use model_dump()
        category_id=db_category.id,
        status=ProductStatus.DRAFT # Initial status is DRAFT
    )
    
    try:
        db.add(db_product)
        await db.commit()
        await db.refresh(db_product)
        new_product_id = db_product.id # Capture the ID here
    except IntegrityError as e:
        await db.rollback()
        if isinstance(e.orig, UniqueViolationError):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{sku}' already exists."
            ) from e
        # Log the full DB error to help diagnose integrity violations
        import logging
        logging.getLogger(__name__).exception("IntegrityError creating product")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected database error occurred."
        ) from e


    task_ids = []
    # Save original images to a temporary location and create tasks
    for image in images:
        # Save raw image to a temporary file
        file_extension = image.filename.split(".")[-1] if "." in image.filename else "tmp"
        temp_filename = f"temp_original_{uuid.uuid4().hex}_{new_product_id}.{file_extension}"
        
        # This is the full path inside the container where the file will be written
        container_full_temp_file_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)


        with open(container_full_temp_file_path, "wb") as buffer:
            buffer.write(await image.read())

        # The path stored in metadata should be the path accessible by the worker,
        # which is the absolute path within the container.
        task_metadata = {
            "product_id": new_product_id,
            "original_image_path": container_full_temp_file_path, # Store the full container path
            "original_filename": image.filename,
            "content_type": image.content_type
        }
        task_in = TaskSchemaCreate(
            product_id=new_product_id,
            task_type=TaskType.IMAGE_PROCESSING,
            status=TaskStatus.PENDING,
            metadata_=task_metadata
        )
        db_task = DBTask(**task_in.model_dump())
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        task_ids.append(db_task.id)

    return {"product_id": new_product_id, "task_ids": task_ids, "message": "Product created and image processing tasks initiated."}




@router.get("", response_model=List[Product])
@router.get("/", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    status: Optional[ProductStatus] = None,
    sku: Optional[str] = None,
    name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    stmt = select(DBProduct).options(selectinload(DBProduct.category_rel))
    is_admin = current_user is not None and current_user.role == UserRole.ADMIN
    if not is_admin:
        if status is not None and status != ProductStatus.PUBLISHED:
            return []
        status = ProductStatus.PUBLISHED
    if category is not None:
        stmt = stmt.join(DBCategory).where(DBCategory.code == category)
    if status is not None:
        stmt = stmt.where(DBProduct.status == status)
    if sku:
        stmt = stmt.where(DBProduct.sku == sku)
    if name:
        stmt = stmt.where(
            DBProduct.name_en.ilike(f"%{name}%") | DBProduct.name_vi.ilike(f"%{name}%")
        )

    result = await db.execute(stmt)
    products = result.scalars().all()
    return [Product.model_validate(product) for product in products] # Use model_validate

@router.get("/{product_id}", response_model=Product)
async def get_product_by_id(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    result = await db.execute(
        select(DBProduct)
        .options(selectinload(DBProduct.category_rel))
        .where(DBProduct.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    is_admin = current_user is not None and current_user.role == UserRole.ADMIN
    if not is_admin and product.status != ProductStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return Product.model_validate(product)

@router.put("/{product_id}", response_model=Product)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    result = await db.execute(
        select(DBProduct)
        .options(selectinload(DBProduct.category_rel))
        .where(DBProduct.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = product_update.model_dump(exclude_unset=True)

    # Explicitly set attributes to ensure SQLAlchemy tracks changes
    if "name" in update_data:
        product.name = update_data["name"]
        product.name_en = update_data["name"]
    if "description" in update_data:
        product.description = update_data["description"]
        product.description_en = update_data["description"]
    if "name_en" in update_data:
        product.name_en = update_data["name_en"]
        product.name = update_data["name_en"]
    if "name_vi" in update_data:
        product.name_vi = update_data["name_vi"]
    if "description_en" in update_data:
        product.description_en = update_data["description_en"]
        product.description = update_data["description_en"]
    if "description_vi" in update_data:
        product.description_vi = update_data["description_vi"]
    if "category" in update_data:
        category_result = await db.execute(
            select(DBCategory).where(DBCategory.code == update_data["category"])
        )
        db_category = category_result.scalars().first()
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category. '{update_data['category']}' does not exist.",
            )
        product.category_id = db_category.id
    if "status" in update_data:
        product.status = update_data["status"]     # Already a ProductStatus enum
    if "specific_attributes" in update_data:
        product.specific_attributes = update_data["specific_attributes"]
    if "images" in update_data:
        product.images = update_data["images"]
    
    db.add(product) # Explicitly add the modified object to the session
    await db.commit()
    await db.refresh(product)
    return Product.model_validate(product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    from sqlalchemy import select, delete
    # First, check if the product exists
    result = await db.execute(
        select(DBProduct)
        .where(DBProduct.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Delete dependent tasks first to satisfy FK constraints
    await db.execute(
        delete(DBTask)
        .where(DBTask.product_id == product_id)
    )
    # Then delete the product
    await db.execute(
        delete(DBProduct)
        .where(DBProduct.id == product_id)
    )
    await db.commit()
    return {"message": "Product deleted successfully"}


@router.post("/{product_id}/images", response_model=Dict[str, Any], status_code=status.HTTP_202_ACCEPTED)
async def add_product_images(
    product_id: int,
    images: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    result = await db.execute(
        select(DBProduct).where(DBProduct.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    task_ids = []
    for image in images:
        file_extension = image.filename.split(".")[-1] if "." in image.filename else "tmp"
        temp_filename = f"temp_original_{uuid.uuid4().hex}_{product_id}.{file_extension}"
        container_full_temp_file_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)

        with open(container_full_temp_file_path, "wb") as buffer:
            buffer.write(await image.read())

        task_metadata = {
            "product_id": product_id,
            "original_image_path": container_full_temp_file_path,
            "original_filename": image.filename,
            "content_type": image.content_type,
        }
        task_in = TaskSchemaCreate(
            product_id=product_id,
            task_type=TaskType.IMAGE_PROCESSING,
            status=TaskStatus.PENDING,
            metadata_=task_metadata,
        )
        db_task = DBTask(**task_in.model_dump())
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        task_ids.append(db_task.id)

    return {"product_id": product_id, "task_ids": task_ids, "message": "Image upload queued."}
