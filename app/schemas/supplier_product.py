from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.product import ProductBase
from app.schemas.base import CamelModel


class SupplierProductSchema(CamelModel):
    id: int
    supplier: "SupplierShort | None" = None
    product: ProductBase | None = None
    price_per_kg: float | None = None
    lead_time_days: int | None = None
    moq: float | None = None
    preferred: bool
    created_at: datetime


class SupplierShort(BaseModel):
    id: int
    code: str
    name: str


class SupplierProductCreateRequest(BaseModel):
    productId: int
    pricePerKg: float | None = None
    leadTimeDays: int | None = None
    moq: float | None = None
    preferred: bool = False


SupplierProductSchema.model_rebuild()
