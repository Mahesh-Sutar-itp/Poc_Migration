from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification


def find_by_recipient(db: Session, username: str) -> list[Notification]:
    return list(
        db.execute(
            select(Notification).where(Notification.recipient_username == username)
            .order_by(Notification.created_at.desc())
        ).scalars().all()
    )


def find_unread_by_recipient(db: Session, username: str) -> list[Notification]:
    return list(
        db.execute(
            select(Notification).where(
                Notification.recipient_username == username, Notification.is_read == False  # noqa: E712
            ).order_by(Notification.created_at.desc())
        ).scalars().all()
    )


def count_unread(db: Session, username: str) -> int:
    return db.execute(
        select(func.count(Notification.id)).where(
            Notification.recipient_username == username, Notification.is_read == False  # noqa: E712
        )
    ).scalar_one()


def find_by_id(db: Session, notif_id: int) -> Notification | None:
    return db.get(Notification, notif_id)


def save(db: Session, notif: Notification) -> Notification:
    db.add(notif)
    db.flush()
    db.refresh(notif)
    return notif
