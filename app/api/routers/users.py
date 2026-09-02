from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import AdminUser
from app.schemas.user import UserSchema, UserCreateRequest, UserUpdateRequest
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model_exclude_none=True)
def list_users(db: Annotated[Session, Depends(get_db)], user: AdminUser):
    return [UserSchema.model_validate(u, from_attributes=True) for u in user_service.find_all(db)]


@router.get("/{user_id}", response_model_exclude_none=True)
def get_user(user_id: int, db: Annotated[Session, Depends(get_db)], user: AdminUser):
    return UserSchema.model_validate(user_service.get_by_id(db, user_id), from_attributes=True)


@router.post("", status_code=201, response_model_exclude_none=True)
def create_user(body: UserCreateRequest, db: Annotated[Session, Depends(get_db)], user: AdminUser):
    return UserSchema.model_validate(
        user_service.create_user(db, body.username, body.password, body.fullName, body.email, body.role), from_attributes=True)


@router.put("/{user_id}", response_model_exclude_none=True)
def update_user(user_id: int, body: UserUpdateRequest, db: Annotated[Session, Depends(get_db)], user: AdminUser):
    return UserSchema.model_validate(
        user_service.update_user(db, user_id, body.fullName, body.email, body.role, body.enabled, body.password), from_attributes=True)


@router.post("/{user_id}/reset-password", status_code=204)
def reset_password(user_id: int, body: dict, db: Annotated[Session, Depends(get_db)], user: AdminUser):
    user_service.update_user(db, user_id, password=body.get("newPassword"))


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Annotated[Session, Depends(get_db)], user: AdminUser):
    user_service.delete_user(db, user_id)
