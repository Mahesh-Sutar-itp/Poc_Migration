from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductBase


class SupplierProductSchema(BaseModel):
    id: int
    supplier: "SupplierShort | None" = None
    product: ProductBase | None = None
    pricePerKg: float | None = None
    leadTimeDays: int | None = None
    moq: float | None = None
    preferred: bool
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)


class SupplierShort(BaseModel):
    id: int
    code: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class SupplierProductCreateRequest(BaseModel):
    productId: int
    pricePerKg: float | None = None
    leadTimeDays: int | None = None
    moq: float | None = None
    preferred: bool = False


SupplierProductSchema.model_rebuild()
