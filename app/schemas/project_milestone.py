from datetime import date, datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema


class ProjectMilestoneSchema(BaseSchema):
    id: int
    name: str
    gateNumber: int
    status: str
    dueDate: date | None = None
    completedAt: datetime | None = None


class ProjectMilestoneCreateRequest(BaseSchema):
    name: str
    gateNumber: int
    dueDate: str | None = None
