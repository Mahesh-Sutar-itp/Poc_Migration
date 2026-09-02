from __future__ import annotations

import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    reason: Mapped[str | None] = mapped_column(Text)
    impact: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="DRAFT")
    requested_by: Mapped[str | None] = mapped_column(String(100))
    requested_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    decided_by: Mapped[str | None] = mapped_column(String(100))
    decided_at: Mapped[datetime.datetime | None] = mapped_column(DateTime)
    decision_comment: Mapped[str | None] = mapped_column(Text)

    product: Mapped["Product"] = relationship("Product")  # noqa: F821
