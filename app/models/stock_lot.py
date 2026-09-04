from __future__ import annotations

import datetime
from decimal import Decimal
from typing import List

from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StockLot(Base):
    __tablename__ = "stock_lots"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    lot_number: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity_on_hand: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(20))
    expiry_date: Mapped[datetime.date | None] = mapped_column(Date)
    supplier_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("suppliers.id", ondelete="SET NULL"))
    received_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")

    product: Mapped["Product"] = relationship("Product")  # noqa: F821
    supplier: Mapped["Supplier | None"] = relationship("Supplier")  # noqa: F821
    movements: Mapped[List["StockMovement"]] = relationship(
        "StockMovement", back_populates="stock_lot", cascade="all, delete-orphan",
    )
