from __future__ import annotations

import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Specification(Base):
    __tablename__ = "specifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    parameter: Mapped[str] = mapped_column(String(100), nullable=False)
    spec_type: Mapped[str] = mapped_column(String(30), nullable=False)
    min_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    max_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    target_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    unit: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    created_by: Mapped[str | None] = mapped_column(String(100))

    product: Mapped["Product"] = relationship("Product")  # noqa: F821

    def is_within_limits(self, value: float) -> bool:
        if self.min_value is not None and value < float(self.min_value):
            return False
        if self.max_value is not None and value > float(self.max_value):
            return False
        return True
