from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema


class ProductBase(BaseSchema):
    id: int
    code: str
    name: str
    description: str | None = None
    productType: str
    state: str
    unit: str | None = None
    costPerKg: float | None = None
    formulaExpression: str | None = None
    allergenFlags: str | None = None
    createdAt: datetime
    updatedAt: datetime
    createdBy: str | None = None
    updatedBy: str | None = None


class CompositionLineIngredient(ProductBase):
    """Product shown as ingredient — without nested collections (matches @JsonIgnoreProperties)."""
    pass


class CompositionLineSchema(BaseSchema):
    id: int
    ingredient: CompositionLineIngredient
    quantity: float
    percentage: float | None = None
    unit: str | None = None
    isAllergen: bool
    position: int


class ProductSchema(ProductBase):
    compositionLines: list[CompositionLineSchema] | None = None
    nutrientValues: list["NutrientValueSchema"] | None = None
    formulationResults: list["FormulationResultSchema"] | None = None
    workflowTasks: list["WorkflowTaskSchema"] | None = None
    qualityChecks: list["QualityCheckSchema"] | None = None


class ProductCreateRequest(BaseSchema):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    productType: str
    unit: str | None = None
    costPerKg: float | None = None
    formulaExpression: str | None = None
    allergenFlags: str | None = None


class ProductUpdateRequest(BaseSchema):
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
