from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema

from app.schemas.corrective_action import CorrectiveActionSchema
from app.schemas.product import ProductBase


class NonConformanceSchema(BaseSchema):
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


class NonConformanceCreateRequest(BaseSchema):
    title: str = Field(..., min_length=1)
    description: str | None = None
    severity: str


class NonConformanceUpdateRequest(BaseSchema):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
