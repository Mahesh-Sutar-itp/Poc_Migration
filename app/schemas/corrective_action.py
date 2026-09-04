from datetime import date, datetime

from pydantic import BaseModel, Field
from app.schemas.base import CamelModel


class CorrectiveActionSchema(CamelModel):
    id: int
    description: str
    owner: str | None = None
    due_date: date | None = None
    status: str
    created_at: datetime
    closed_at: datetime | None = None


class CorrectiveActionCreateRequest(BaseModel):
    description: str = Field(..., min_length=1)
    owner: str | None = None
    dueDate: str | None = None
