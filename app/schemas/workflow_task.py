from datetime import datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema


class WorkflowTaskSchema(BaseSchema):
    id: int
    productId: int | None = None
    taskName: str
    description: str | None = None
    assignee: str | None = None
    status: str
    dueDate: datetime | None = None
    completedAt: datetime | None = None
    createdAt: datetime
