from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, pattern=r"^[A-Z0-9_]+$")
    name_en: str = Field(..., min_length=1, max_length=100)
    name_vi: str = Field(..., min_length=1, max_length=100)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name_en: Optional[str] = Field(None, min_length=1, max_length=100)
    name_vi: Optional[str] = Field(None, min_length=1, max_length=100)


class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
