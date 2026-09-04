from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse, UserDto
from app.services import auth_service
from app.api.deps import CurrentUser

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, response_model_exclude_none=True)
def login(body: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    result = auth_service.login(db, body.username, body.password)
    user = result["user"]
    return LoginResponse(token=result["token"], user=UserDto(id=user.id, username=user.username, fullName=user.full_name, email=user.email, role=user.role))


@router.get("/me", response_model_exclude_none=True)
def me(user: CurrentUser):
    return {"id": user.id, "username": user.username, "fullName": user.full_name, "email": user.email, "role": user.role}
