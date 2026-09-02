from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CorrectiveActionSchema(BaseModel):
    id: int
    description: str
    owner: str | None = None
    dueDate: str | None = None  # date as string
    status: str
    createdAt: datetime
    closedAt: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CorrectiveActionCreateRequest(BaseModel):
    description: str = Field(..., min_length=1)
    owner: str | None = None
    dueDate: str | None = None
