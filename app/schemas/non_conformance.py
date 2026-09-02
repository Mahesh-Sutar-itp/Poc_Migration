from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.corrective_action import CorrectiveActionSchema
from app.schemas.product import ProductBase


class NonConformanceSchema(BaseModel):
    id: int
    product: ProductBase
    title: str
    description: str | None = None
    severity: str
    status: str
    raisedBy: str | None = None
    raisedAt: datetime
    closedAt: datetime | None = None
    correctiveActions: list[CorrectiveActionSchema] | None = None

    model_config = ConfigDict(from_attributes=True)


class NonConformanceCreateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    severity: str


class NonConformanceUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
