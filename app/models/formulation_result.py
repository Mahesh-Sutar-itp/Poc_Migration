from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Dict

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FormulationResult(Base):
    __tablename__ = "formulation_results"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    chain_id: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    computed_values: Mapped[Dict[str, float] | None] = mapped_column(JSONB)
    nutri_score: Mapped[str | None] = mapped_column(String(5))
    eco_score: Mapped[str | None] = mapped_column(String(5))
    total_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    errors: Mapped[str | None] = mapped_column(Text)
    warnings: Mapped[str | None] = mapped_column(Text)
    formulated_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))

    product: Mapped["Product"] = relationship("Product", back_populates="formulation_results")  # noqa: F821
