from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.corrective_action import CorrectiveActionSchema
from app.schemas.product import ProductBase
from app.schemas.base import CamelModel


class NonConformanceSchema(CamelModel):
    id: int
    product: ProductBase
    title: str
    description: str | None = None
    severity: str
    status: str
    raised_by: str | None = None
    raised_at: datetime
    closed_at: datetime | None = None
    corrective_actions: list[CorrectiveActionSchema] | None = None


class NonConformanceCreateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    severity: str


class NonConformanceUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
