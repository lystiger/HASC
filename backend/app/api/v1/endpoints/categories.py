from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, get_current_admin_user, get_optional_user
from app.models.category import Category as DBCategory
from app.models.product import Product as DBProduct
from app.models.user import User
from app.schemas.category import Category, CategoryCreate, CategoryUpdate

router = APIRouter()


@router.get("", response_model=List[Category])
@router.get("/", response_model=List[Category])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    result = await db.execute(select(DBCategory).order_by(DBCategory.code))
    categories = result.scalars().all()
    return [Category.model_validate(category) for category in categories]


@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    db_category = DBCategory(
        code=category_in.code.strip().upper(),
        name_en=category_in.name_en.strip(),
        name_vi=category_in.name_vi.strip(),
    )
    db.add(db_category)
    try:
        await db.commit()
        await db.refresh(db_category)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{category_in.code}' already exists.",
        ) from exc

    return Category.model_validate(db_category)


@router.get("/{category_id}", response_model=Category)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    result = await db.execute(select(DBCategory).where(DBCategory.id == category_id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return Category.model_validate(category)


@router.put("/{category_id}", response_model=Category)
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    result = await db.execute(select(DBCategory).where(DBCategory.id == category_id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_name_en = category_in.name_en.strip() if category_in.name_en is not None else None
    update_name_vi = category_in.name_vi.strip() if category_in.name_vi is not None else None
    if update_name_en:
        category.name_en = update_name_en
    if update_name_vi:
        category.name_vi = update_name_vi

    try:
        await db.commit()
        await db.refresh(category)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category update conflicts with an existing record.",
        ) from exc

    return Category.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    result = await db.execute(select(DBCategory).where(DBCategory.id == category_id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Prevent deletion if products reference this category
    products_result = await db.execute(
        select(DBProduct.id).where(DBProduct.category_id == category.id).limit(1)
    )
    if products_result.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category is in use by products and cannot be deleted.",
        )

    await db.delete(category)
    await db.commit()
    return None
