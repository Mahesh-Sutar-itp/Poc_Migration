from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser
from app.schemas.notification import NotificationSchema
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _schema(n):
    return NotificationSchema(id=n.id, title=n.title, message=n.message, link=n.link,
                              category=n.category, read=n.is_read, createdAt=n.created_at)


@router.get("", response_model_exclude_none=True)
def get_mine(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [_schema(n) for n in notification_service.get_for_user(db, user.username)]


@router.get("/unread", response_model_exclude_none=True)
def unread(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [_schema(n) for n in notification_service.get_unread(db, user.username)]


@router.get("/unread-count", response_model_exclude_none=True)
def unread_count(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return {"count": notification_service.count_unread(db, user.username)}


@router.post("/{notif_id}/read", response_model_exclude_none=True)
def mark_read(notif_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return _schema(notification_service.mark_read(db, notif_id))


@router.post("/read-all", status_code=204)
def mark_all_read(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    notification_service.mark_all_read(db, user.username)
