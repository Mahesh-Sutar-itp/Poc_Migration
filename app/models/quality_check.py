from __future__ import annotations

import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class QualityCheck(Base):
    __tablename__ = "quality_checks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    check_type: Mapped[str] = mapped_column(String(50), nullable=False)
    result: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    checked_by: Mapped[str | None] = mapped_column(String(100))
    checked_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))

    product: Mapped["Product"] = relationship("Product", back_populates="quality_checks")  # noqa: F821
