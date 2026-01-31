from typing import List, Optional, Dict, Any
from datetime import datetime

from pydantic import BaseModel
from app.models.product import ProductCategory, ProductStatus


class ImageInfo(BaseModel):
    original_name: str
    web_url: str
    thumb_url: str


class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: ProductCategory
    images: List[ImageInfo] = []  # Updated to List[ImageInfo]
    specific_attributes: Dict[str, Any] = {}


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[ProductCategory] = None
    status: Optional[ProductStatus] = None
    images: Optional[List[ImageInfo]] = None  # Updated to Optional[List[ImageInfo]]
    specific_attributes: Optional[Dict[str, Any]] = None


class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: ProductStatus = ProductStatus.DRAFT

    class Config:
        from_attributes = True


class Product(ProductInDBBase):
    pass
