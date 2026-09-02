from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.repositories import user_repository


def login(db: Session, username: str, raw_password: str) -> dict:
    user = user_repository.find_by_username(db, username)
    if not user or not verify_password(raw_password, user.password_hash):
        raise FormCraftException("Invalid username or password")
    if not user.enabled:
        raise FormCraftException("User account is disabled")
    token = create_access_token(user.username, user.role, user.full_name)
    return {"token": token, "user": user}


def get_current_user(db: Session, username: str) -> User:
    user = user_repository.find_by_username(db, username)
    if not user:
        raise EntityNotFoundException("User", username)
    return user
