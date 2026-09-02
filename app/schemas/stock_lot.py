from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductBase
from app.schemas.supplier import SupplierSchema


class StockMovementSchema(BaseModel):
    id: int
    movementType: str
    quantity: float
    performedBy: str | None = None
    performedAt: datetime
    reference: str | None = None

    model_config = ConfigDict(from_attributes=True)


class StockLotSchema(BaseModel):
    id: int
    product: ProductBase
    lotNumber: str
    quantityOnHand: float
    unit: str | None = None
    expiryDate: str | None = None
    supplier: SupplierSchema | None = None
    receivedAt: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)
