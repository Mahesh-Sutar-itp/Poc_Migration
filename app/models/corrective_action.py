from __future__ import annotations

import datetime

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    non_conformance_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("non_conformances.id", ondelete="CASCADE"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    owner: Mapped[str | None] = mapped_column(String(100))
    due_date: Mapped[datetime.date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="OPEN")
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    closed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime)

    non_conformance: Mapped["NonConformance"] = relationship("NonConformance", back_populates="corrective_actions")  # noqa: F821
