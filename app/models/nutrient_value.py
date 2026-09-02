from __future__ import annotations

from decimal import Decimal

from sqlalchemy import BigInteger, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NutrientValue(Base):
    __tablename__ = "nutrient_values"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    nutrient_type: Mapped[str] = mapped_column(String(30), nullable=False)
    value_per_100g: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(10), default="g")

    product: Mapped["Product"] = relationship("Product", back_populates="nutrient_values")  # noqa: F821

    @property
    def value_per_100g_as_double(self) -> float:
        return float(self.value_per_100g) if self.value_per_100g else 0.0
