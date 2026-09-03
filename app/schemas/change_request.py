from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema

from app.schemas.product import ProductBase


class ChangeRequestSchema(BaseSchema):
    id: int
    product: ProductBase
    title: str
    description: str | None = None
    reason: str | None = None
    impact: str | None = None
    status: str
    requestedBy: str | None = None
    requestedAt: datetime
    decidedBy: str | None = None
    decidedAt: datetime | None = None
    decisionComment: str | None = None


class ChangeRequestCreateRequest(BaseSchema):
    productId: int
    title: str = Field(..., min_length=1)
    description: str | None = None
    reason: str | None = None
    impact: str | None = None


class DecisionRequest(BaseSchema):
    approve: bool
    comment: str | None = None
