from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import CamelModel


class CustomAttributeDefinitionSchema(CamelModel):
    id: int
    attribute_key: str
    label: str
    data_type: str
    required: bool
    applies_to_product_type: str | None = None
    validation_regex: str | None = None
    column_name: str | None = None
    created_at: datetime


class DefineAttributeRequest(BaseModel):
    attributeKey: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=150)
    dataType: str
    required: bool = False
    appliesToProductType: str | None = None
    validationRegex: str | None = None
