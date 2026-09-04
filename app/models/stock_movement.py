from __future__ import annotations

import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    stock_lot_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stock_lots.id", ondelete="CASCADE"), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    performed_by: Mapped[str | None] = mapped_column(String(100))
    performed_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    reference: Mapped[str | None] = mapped_column(String(255))

    stock_lot: Mapped["StockLot"] = relationship("StockLot", back_populates="movements")  # noqa: F821
