from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.product import ProductBase
from app.schemas.base import CamelModel


class ChangeRequestSchema(CamelModel):
    id: int
    product: ProductBase
    title: str
    description: str | None = None
    reason: str | None = None
    impact: str | None = None
    status: str
    requested_by: str | None = None
    requested_at: datetime
    decided_by: str | None = None
    decided_at: datetime | None = None
    decision_comment: str | None = None


class ChangeRequestCreateRequest(BaseModel):
    productId: int
    title: str = Field(..., min_length=1)
    description: str | None = None
    reason: str | None = None
    impact: str | None = None


class DecisionRequest(BaseModel):
    status: str
    decisionComment: str | None = None
