from datetime import datetime

from pydantic import BaseModel, Field
from app.schemas.base import CamelModel


class SpecificationSchema(CamelModel):
    id: int
    parameter: str
    spec_type: str
    min_value: float | None = None
    max_value: float | None = None
    target_value: float | None = None
    unit: str | None = None
    created_at: datetime
    created_by: str | None = None


class SpecificationCreateRequest(BaseModel):
    parameter: str = Field(..., min_length=1)
    specType: str
    minValue: float | None = None
    maxValue: float | None = None
    targetValue: float | None = None
    unit: str | None = None


class SpecificationUpdateRequest(BaseModel):
    parameter: str | None = None
    specType: str | None = None
    minValue: float | None = None
    maxValue: float | None = None
    targetValue: float | None = None
    unit: str | None = None
