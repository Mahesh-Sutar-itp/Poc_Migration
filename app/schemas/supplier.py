from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SupplierSchema(BaseModel):
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

    model_config = ConfigDict(from_attributes=True)


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
