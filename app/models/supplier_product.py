from __future__ import annotations

import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    price_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    lead_time_days: Mapped[int | None] = mapped_column(Integer)
    moq: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    preferred: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="supplier_products")  # noqa: F821
    product: Mapped["Product"] = relationship("Product")  # noqa: F821
