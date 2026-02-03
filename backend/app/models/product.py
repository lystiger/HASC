import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    func,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import Enum, JSON


from app.db.base import Base


class ProductStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    FAILED = "FAILED"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    status = Column(Enum(ProductStatus), nullable=False, default=ProductStatus.DRAFT)

    images = Column(JSON)
    specific_attributes = Column(JSON)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    tasks = relationship("Task", back_populates="product")
    category_rel = relationship("Category", back_populates="products")

    @property
    def category(self) -> str | None:
        if self.category_rel is None:
            return None
        return self.category_rel.name
