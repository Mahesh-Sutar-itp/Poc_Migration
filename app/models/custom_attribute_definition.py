from __future__ import annotations

import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CustomAttributeDefinition(Base):
    """Customization Gate 2 (BMIDE-style): a client-defined attribute that Product
    instances may carry in their custom_attributes map. Registering one of these is a
    config-time action — no schema migration or Python code required."""

    __tablename__ = "product_attribute_definitions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    attribute_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    data_type: Mapped[str] = mapped_column(String(20), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Restrict this attribute to one product type; None applies it to every product.
    applies_to_product_type: Mapped[str | None] = mapped_column(String(30))
    validation_regex: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.UTC)
    )
