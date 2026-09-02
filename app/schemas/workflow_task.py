from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkflowTaskSchema(BaseModel):
    id: int
    productId: int | None = None
    taskName: str
    description: str | None = None
    assignee: str | None = None
    status: str
    dueDate: datetime | None = None
    completedAt: datetime | None = None
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
