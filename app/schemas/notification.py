from datetime import datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class NotificationSchema(CamelModel):
    id: int
    title: str
    message: str | None = None
    link: str | None = None
    category: str
    read: bool
    created_at: datetime
