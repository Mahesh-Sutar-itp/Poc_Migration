from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProjectMilestoneSchema(BaseModel):
    id: int
    name: str
    gateNumber: int
    status: str
    dueDate: str | None = None
    completedAt: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectMilestoneCreateRequest(BaseModel):
    name: str
    gateNumber: int
    dueDate: str | None = None
