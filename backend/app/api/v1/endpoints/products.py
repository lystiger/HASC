from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.db.session import AsyncSessionLocal
from app.schemas.product import ProductCreate, Product, ProductCategory, ProductStatus
from app.models.product import Product as DBProduct # Keep this import for the DBProduct instance
from app.services.image_processing import process_images_async

router = APIRouter()

# Dependency to get the database session
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/", response_model=Product, status_code=status.HTTP_202_ACCEPTED)
async def create_product(
    sku: str = Form(...),
    name: str = Form(...),
    category: ProductCategory = Form(...),
    description: Optional[str] = Form(None),
    specific_attributes: str = Form("{}"), # JSON string
    images: List[UploadFile] = File([]),
    db: AsyncSession = Depends(get_db)
):
    # Basic validation for category
    if category not in [pc.value for pc in ProductCategory]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {[pc.value for pc in ProductCategory]}"
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
        name=name,
        category=category,
        description=description,
        specific_attributes=parsed_specific_attributes,
        images=[] # Images will be handled by async process
    )

    db_product = DBProduct(
        **product_in.model_dump(), # Use model_dump()
        status=ProductStatus.DRAFT # Initial status is DRAFT
    )
    
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)

    # Prepare image data for async processing
    image_contents = []
    original_filenames = []
    for image in images:
        image_contents.append(await image.read())
        original_filenames.append(image.filename)

    # Call the async image processing function
    await process_images_async(db_product.id, image_contents, original_filenames, db)

    # Refresh the product after image processing has updated its status and images
    await db.refresh(db_product)

    return Product.model_validate(db_product) # Use model_validate


@router.get("/", response_model=List[Product])
async def get_products(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(DBProduct))
    products = result.scalars().all()
    return [Product.model_validate(product) for product in products] # Use model_validate
