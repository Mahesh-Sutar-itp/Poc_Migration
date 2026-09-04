from __future__ import annotations

import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CompositionLine(Base):
    __tablename__ = "composition_lines"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    ingredient_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    percentage: Mapped[Decimal | None] = mapped_column(Numeric(6, 4))
    unit: Mapped[str | None] = mapped_column(String(20))
    is_allergen: Mapped[bool | None] = mapped_column(Boolean, default=False)
    position: Mapped[int | None] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))

    product: Mapped["Product"] = relationship(  # noqa: F821
        "Product", back_populates="composition_lines", foreign_keys=[product_id],
    )
    ingredient: Mapped["Product"] = relationship(  # noqa: F821
        "Product", foreign_keys=[ingredient_id],
    )

    @property
    def quantity_fraction(self) -> float:
        return float(self.quantity) / 100.0 if self.quantity else 0.0
