from __future__ import annotations

import datetime
from typing import List

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NonConformance(Base):
    __tablename__ = "non_conformances"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quality_check_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("quality_checks.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="OPEN")
    raised_by: Mapped[str | None] = mapped_column(String(100))
    raised_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))
    closed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime)

    product: Mapped["Product"] = relationship("Product")  # noqa: F821
    quality_check: Mapped["QualityCheck | None"] = relationship("QualityCheck")  # noqa: F821
    corrective_actions: Mapped[List["CorrectiveAction"]] = relationship(
        "CorrectiveAction", back_populates="non_conformance", cascade="all, delete-orphan",
    )
