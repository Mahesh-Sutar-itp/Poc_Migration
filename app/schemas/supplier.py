from datetime import datetime

from pydantic import BaseModel, Field
from app.schemas.base import CamelModel


class SupplierSchema(CamelModel):
    id: int
    code: str
    name: str
    contact_name: str | None = None
    contact_email: str | None = None
    phone: str | None = None
    address: str | None = None
    rating: int | None = None
    active: bool
    created_at: datetime


class SupplierCreateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    contactName: str | None = None
    contactEmail: str | None = None
    phone: str | None = None
    address: str | None = None
    rating: int | None = None


class SupplierUpdateRequest(BaseModel):
    name: str | None = None
    contactName: str | None = None
    contactEmail: str | None = None
    phone: str | None = None
    address: str | None = None
    rating: int | None = None
    active: bool | None = None
