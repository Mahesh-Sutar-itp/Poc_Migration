from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductBase


class ChangeRequestSchema(BaseModel):
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

    model_config = ConfigDict(from_attributes=True)


class ChangeRequestCreateRequest(BaseModel):
    productId: int
    title: str = Field(..., min_length=1)
    description: str | None = None
    reason: str | None = None
    impact: str | None = None


class DecisionRequest(BaseModel):
    status: str
    decisionComment: str | None = None
