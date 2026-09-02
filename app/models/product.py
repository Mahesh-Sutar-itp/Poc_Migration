from __future__ import annotations

import datetime
from decimal import Decimal
from typing import List

from sqlalchemy import BigInteger, Column, Numeric, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.enums.product_state import ProductState
from app.enums.product_type import ProductType


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    product_type: Mapped[str] = mapped_column(String(30), nullable=False)
    state: Mapped[str] = mapped_column(String(30), nullable=False, default=ProductState.DRAFT.value)
    unit: Mapped[str | None] = mapped_column(String(20))
    cost_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    formula_expression: Mapped[str | None] = mapped_column(Text)
    allergen_flags: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_by: Mapped[str | None] = mapped_column(String(100))
    updated_by: Mapped[str | None] = mapped_column(String(100))
    version: Mapped[int | None] = mapped_column(BigInteger, default=0)

    __mapper_args__ = {"version_id_col": version}

    composition_lines: Mapped[List["CompositionLine"]] = relationship(
        "CompositionLine", back_populates="product", cascade="all, delete-orphan",
        order_by="CompositionLine.position", foreign_keys="CompositionLine.product_id",
    )
    nutrient_values: Mapped[List["NutrientValue"]] = relationship(
        "NutrientValue", back_populates="product", cascade="all, delete-orphan",
    )
    formulation_results: Mapped[List["FormulationResult"]] = relationship(
        "FormulationResult", back_populates="product", cascade="all, delete-orphan",
    )
    workflow_tasks: Mapped[List["WorkflowTask"]] = relationship(
        "WorkflowTask", back_populates="product", cascade="all, delete-orphan",
    )
    quality_checks: Mapped[List["QualityCheck"]] = relationship(
        "QualityCheck", back_populates="product", cascade="all, delete-orphan",
    )

    def has_allergen(self, allergen: str) -> bool:
        if not self.allergen_flags:
            return False
        return allergen in self.allergen_flags.split(",")

    @property
    def is_finished_product(self) -> bool:
        return self.product_type == ProductType.FINISHED_PRODUCT.value

    @property
    def is_raw_material(self) -> bool:
        return self.product_type == ProductType.RAW_MATERIAL.value
