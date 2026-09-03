from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema


class SupplierSchema(BaseSchema):
    id: int
    code: str
    name: str
    contactName: str | None = None
    contactEmail: str | None = None
    phone: str | None = None
    address: str | None = None
    rating: int | None = None
    active: bool
    createdAt: datetime


class SupplierCreateRequest(BaseSchema):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    contactName: str | None = None
    contactEmail: str | None = None
    phone: str | None = None
    address: str | None = None
    rating: int | None = None


class SupplierUpdateRequest(BaseSchema):
    name: str | None = None
    contactName: str | None = None
    contactEmail: str | None = None
    phone: str | None = None
    address: str | None = None
    rating: int | None = None
    active: bool | None = None
