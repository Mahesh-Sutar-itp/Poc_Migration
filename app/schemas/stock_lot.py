from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.product import ProductBase
from app.schemas.supplier import SupplierSchema
from app.schemas.base import CamelModel


class StockMovementSchema(CamelModel):
    id: int
    movement_type: str
    quantity: float
    performed_by: str | None = None
    performed_at: datetime
    reference: str | None = None


class StockLotSchema(CamelModel):
    id: int
    product: ProductBase
    lot_number: str
    quantity_on_hand: float
    unit: str | None = None
    expiry_date: date | None = None
    supplier: SupplierSchema | None = None
    received_at: datetime
    status: str
