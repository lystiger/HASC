import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    func,
)
from sqlalchemy.types import Enum, JSON # Changed import and added JSON type

from app.db.base import Base


class ProductCategory(str, enum.Enum):
    PACKAGING = "PACKAGING"
    FILTERS = "FILTERS"
    CHEMICALS = "CHEMICALS"
    EQUIPMENT = "EQUIPMENT"


class ProductStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    category = Column(Enum(ProductCategory), nullable=False)
    status = Column(Enum(ProductStatus), nullable=False, default=ProductStatus.DRAFT)

    images = Column(JSON)  # Changed to JSON
    specific_attributes = Column(JSON)  # Changed to JSON

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
