from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema

from app.schemas.product import ProductBase


class SupplierProductSchema(BaseSchema):
    id: int
    supplier: "SupplierShort | None" = None
    product: ProductBase | None = None
    pricePerKg: float | None = None
    leadTimeDays: int | None = None
    moq: float | None = None
    preferred: bool
    createdAt: datetime


class SupplierShort(BaseSchema):
    id: int
    code: str
    name: str


class SupplierProductCreateRequest(BaseSchema):
    productId: int
    pricePerKg: float | None = None
    leadTimeDays: int | None = None
    moq: float | None = None
    preferred: bool = False


SupplierProductSchema.model_rebuild()
