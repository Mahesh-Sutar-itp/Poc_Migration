from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserSchema(BaseModel):
    id: int
    username: str
    fullName: str | None = None
    email: str | None = None
    role: str
    enabled: bool
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)


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
