from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.core.security import hash_password
from app.models.user import User
from app.repositories import user_repository


def find_all(db: Session) -> list[User]:
    return user_repository.find_all(db)


def get_by_id(db: Session, user_id: int) -> User:
    u = user_repository.find_by_id(db, user_id)
    if not u:
        raise EntityNotFoundException("User", user_id)
    return u


def create_user(db: Session, username: str, raw_password: str, full_name: str | None, email: str | None, role: str) -> User:
    if user_repository.exists_by_username(db, username):
        raise FormCraftException(f"Username '{username}' is already taken")
    user = User()
    user.username = username
    user.password_hash = hash_password(raw_password)
    user.full_name = full_name
    user.email = email
    user.role = role
    user.enabled = True
    saved = user_repository.save(db, user)
    db.commit()
    return saved


def update_user(db: Session, user_id: int, full_name: str | None = None, email: str | None = None,
                role: str | None = None, enabled: bool | None = None, password: str | None = None) -> User:
    user = get_by_id(db, user_id)
    if full_name is not None: user.full_name = full_name
    if email is not None: user.email = email
    if role is not None: user.role = role
    if enabled is not None: user.enabled = enabled
    if password is not None: user.password_hash = hash_password(password)
    saved = user_repository.save(db, user)
    db.commit()
    return saved


def delete_user(db: Session, user_id: int) -> None:
    user = get_by_id(db, user_id)
    user_repository.delete(db, user)
    db.commit()
