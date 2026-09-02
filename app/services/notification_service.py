from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.notification import Notification
from app.repositories import notification_repository, user_repository


def notify_user(db: Session, username: str, title: str, message: str, link: str | None, category: str) -> Notification:
    notif = Notification()
    notif.recipient_username = username
    notif.title = title
    notif.message = message
    notif.link = link
    notif.category = category
    saved = notification_repository.save(db, notif)
    db.commit()
    return saved


def notify_role(db: Session, role: str, title: str, message: str, link: str | None, category: str) -> None:
    users = user_repository.find_by_role(db, role)
    for user in users:
        notif = Notification()
        notif.recipient_username = user.username
        notif.title = title
        notif.message = message
        notif.link = link
        notif.category = category
        notification_repository.save(db, notif)
    db.commit()


def get_for_user(db: Session, username: str) -> list[Notification]:
    return notification_repository.find_by_recipient(db, username)


def get_unread(db: Session, username: str) -> list[Notification]:
    return notification_repository.find_unread_by_recipient(db, username)


def count_unread(db: Session, username: str) -> int:
    return notification_repository.count_unread(db, username)


def mark_read(db: Session, notif_id: int) -> Notification:
    notif = notification_repository.find_by_id(db, notif_id)
    if not notif:
        raise EntityNotFoundException("Notification", notif_id)
    notif.is_read = True
    saved = notification_repository.save(db, notif)
    db.commit()
    return saved


def mark_all_read(db: Session, username: str) -> None:
    unread = notification_repository.find_unread_by_recipient(db, username)
    for n in unread:
        n.is_read = True
    db.commit()
