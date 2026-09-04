from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field
from app.schemas.base import CamelModel


class ProductBase(CamelModel):
    id: int
    code: str
    name: str
    description: str | None = None
    product_type: str
    state: str
    unit: str | None = None
    cost_per_kg: float | None = None
    formula_expression: str | None = None
    allergen_flags: str | None = None
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    updated_by: str | None = None


class CompositionLineIngredient(ProductBase):
    """Product shown as ingredient — without nested collections (matches @JsonIgnoreProperties)."""
    pass


class CompositionLineSchema(CamelModel):
    id: int
    ingredient: CompositionLineIngredient
    quantity: float
    percentage: float | None = None
    unit: str | None = None
    is_allergen: bool
    position: int


class ProductSchema(ProductBase):
    composition_lines: list[CompositionLineSchema] | None = None
    nutrient_values: list["NutrientValueSchema"] | None = None
    formulation_results: list["FormulationResultSchema"] | None = None
    workflow_tasks: list["WorkflowTaskSchema"] | None = None
    quality_checks: list["QualityCheckSchema"] | None = None


class ProductCreateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    productType: str
    unit: str | None = None
    costPerKg: float | None = None
    formulaExpression: str | None = None
    allergenFlags: str | None = None


class ProductUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    unit: str | None = None
    costPerKg: float | None = None
    formulaExpression: str | None = None
    allergenFlags: str | None = None


from app.schemas.nutrient_value import NutrientValueSchema
from app.schemas.formulation_result import FormulationResultSchema
from app.schemas.workflow_task import WorkflowTaskSchema
from app.schemas.quality_check import QualityCheckSchema

ProductSchema.model_rebuild()
