from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema


class UserSchema(BaseSchema):
    id: int
    username: str
    fullName: str | None = None
    email: str | None = None
    role: str
    enabled: bool
    createdAt: datetime


class UserCreateRequest(BaseSchema):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)
    fullName: str | None = None
    email: str | None = None
    role: str


class UserUpdateRequest(BaseSchema):
    fullName: str | None = None
    email: str | None = None
    role: str | None = None
    enabled: bool | None = None
    password: str | None = None
