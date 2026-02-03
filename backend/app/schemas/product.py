from typing import List, Optional, Dict, Any
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.product import ProductStatus


class ImageInfo(BaseModel):
    original_name: str
    web_url: str
    thumb_url: str


class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: str
    images: List[ImageInfo] = []  # Updated to List[ImageInfo]
    specific_attributes: Dict[str, Any] = {}


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: str | None = Field(None) # Corrected description field
    category: Optional[str] = None
    status: Optional[ProductStatus] = None
    images: Optional[List[ImageInfo]] = None  # Updated to Optional[List[ImageInfo]]
    specific_attributes: Optional[Dict[str, Any]] = None


class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    status: ProductStatus = ProductStatus.DRAFT

    model_config = ConfigDict(from_attributes=True) # Use ConfigDict

    @field_validator("category", mode="before")
    @classmethod
    def normalize_category(cls, value):
        if isinstance(value, str) or value is None:
            return value
        name = getattr(value, "name", None)
        if name is not None:
            return name
        return value


class Product(ProductInDBBase):
    pass
