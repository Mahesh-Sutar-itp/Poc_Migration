from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserPayload(BaseModel):
    username: str
    role: str
    fullName: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserPayload
