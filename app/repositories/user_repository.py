from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def find_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def find_by_username(db: Session, username: str) -> User | None:
    return db.execute(select(User).where(User.username == username)).scalar_one_or_none()


def exists_by_username(db: Session, username: str) -> bool:
    return db.execute(select(User.id).where(User.username == username).limit(1)).first() is not None


def find_by_role(db: Session, role: str) -> list[User]:
    return list(db.execute(select(User).where(User.role == role)).scalars().all())


def find_all(db: Session) -> list[User]:
    return list(db.execute(select(User).order_by(User.id)).scalars().all())


def save(db: Session, user: User) -> User:
    db.add(user)
    db.flush()
    db.refresh(user)
    return user


def delete(db: Session, user: User) -> None:
    db.delete(user)
    db.flush()
