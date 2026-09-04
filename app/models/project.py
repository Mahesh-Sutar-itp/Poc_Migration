from __future__ import annotations

import datetime
from typing import List

from sqlalchemy import BigInteger, Column, Date, DateTime, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

project_products = Table(
    "project_products",
    Base.metadata,
    Column("project_id", BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("product_id", BigInteger, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PLANNING")
    owner: Mapped[str | None] = mapped_column(String(100))
    target_launch_date: Mapped[datetime.date | None] = mapped_column(Date)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC))

    products: Mapped[List["Product"]] = relationship("Product", secondary=project_products)  # noqa: F821
    milestones: Mapped[List["ProjectMilestone"]] = relationship(
        "ProjectMilestone", back_populates="project", cascade="all, delete-orphan",
        order_by="ProjectMilestone.gate_number",
    )
