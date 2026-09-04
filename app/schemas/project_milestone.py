from datetime import date, datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class ProjectMilestoneSchema(CamelModel):
    id: int
    name: str
    gate_number: int
    status: str
    due_date: date | None = None
    completed_at: datetime | None = None


class ProjectMilestoneCreateRequest(BaseModel):
    name: str
    gateNumber: int
    dueDate: str | None = None
