from datetime import datetime

from pydantic import BaseModel, Field
from app.schemas.base import CamelModel


class UserSchema(CamelModel):
    id: int
    username: str
    full_name: str | None = None
    email: str | None = None
    role: str
    enabled: bool
    created_at: datetime


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)
    fullName: str | None = None
    email: str | None = None
    role: str


class UserUpdateRequest(BaseModel):
    fullName: str | None = None
    email: str | None = None
    role: str | None = None
    enabled: bool | None = None
    password: str | None = None
