from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema


class CorrectiveActionSchema(BaseSchema):
    id: int
    description: str
    owner: str | None = None
    dueDate: date | None = None
    status: str
    createdAt: datetime
    closedAt: datetime | None = None


class CorrectiveActionCreateRequest(BaseSchema):
    description: str = Field(..., min_length=1)
    owner: str | None = None
    dueDate: str | None = None
