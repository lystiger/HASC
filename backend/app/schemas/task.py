from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel

from app.models.task import TaskStatus, TaskType


class TaskBase(BaseModel):
    product_id: int
    task_type: TaskType
    status: TaskStatus = TaskStatus.PENDING
    metadata_: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None
    metadata_: Optional[Dict[str, Any]] = None


class TaskInDBBase(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Task(TaskInDBBase):
    pass

