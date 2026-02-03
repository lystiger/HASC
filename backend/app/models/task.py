import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Enum, JSON

from app.db.base import Base


class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TaskType(str, enum.Enum):
    IMAGE_PROCESSING = "IMAGE_PROCESSING"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING)
    task_type = Column(Enum(TaskType), nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    metadata_ = Column(JSON, nullable=True) # Using metadata_ to avoid conflict with Python keyword
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)

    product = relationship("Product", back_populates="tasks")
