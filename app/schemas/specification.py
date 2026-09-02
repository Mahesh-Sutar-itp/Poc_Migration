from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SpecificationSchema(BaseModel):
    id: int
    parameter: str
    specType: str
    minValue: float | None = None
    maxValue: float | None = None
    targetValue: float | None = None
    unit: str | None = None
    createdAt: datetime
    createdBy: str | None = None

    model_config = ConfigDict(from_attributes=True)


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
