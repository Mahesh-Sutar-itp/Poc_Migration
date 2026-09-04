from datetime import datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class WorkflowTaskSchema(CamelModel):
    id: int
    product_id: int | None = None
    task_name: str
    description: str | None = None
    assignee: str | None = None
    status: str
    due_date: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
