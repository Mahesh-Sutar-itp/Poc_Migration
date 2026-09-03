from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema


class SpecificationSchema(BaseSchema):
    id: int
    parameter: str
    specType: str
    minValue: float | None = None
    maxValue: float | None = None
    targetValue: float | None = None
    unit: str | None = None
    createdAt: datetime
    createdBy: str | None = None


class SpecificationCreateRequest(BaseSchema):
    parameter: str = Field(..., min_length=1)
    specType: str
    minValue: float | None = None
    maxValue: float | None = None
    targetValue: float | None = None
    unit: str | None = None


class SpecificationUpdateRequest(BaseSchema):
    parameter: str | None = None
    specType: str | None = None
    minValue: float | None = None
    maxValue: float | None = None
    targetValue: float | None = None
    unit: str | None = None
