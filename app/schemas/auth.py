from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserDto(BaseModel):
    id: int
    username: str
    fullName: str | None = None
    email: str | None = None
    role: str


class LoginResponse(BaseModel):
    token: str
    user: UserDto
