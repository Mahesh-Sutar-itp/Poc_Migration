from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
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

    model_config = ConfigDict(from_attributes=True)


class CompositionLineIngredient(ProductBase):
    """Product shown as ingredient — without nested collections (matches @JsonIgnoreProperties)."""
    pass


class CompositionLineSchema(BaseModel):
    id: int
    ingredient: CompositionLineIngredient
    quantity: float
    percentage: float | None = None
    unit: str | None = None
    isAllergen: bool
    position: int

    model_config = ConfigDict(from_attributes=True)


class ProductSchema(ProductBase):
    compositionLines: list[CompositionLineSchema] | None = None
    nutrientValues: list["NutrientValueSchema"] | None = None
    formulationResults: list["FormulationResultSchema"] | None = None
    workflowTasks: list["WorkflowTaskSchema"] | None = None
    qualityChecks: list["QualityCheckSchema"] | None = None


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
