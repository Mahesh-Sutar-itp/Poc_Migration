from datetime import datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema


class NotificationSchema(BaseSchema):
    id: int
    title: str
    message: str | None = None
    link: str | None = None
    category: str
    read: bool
    createdAt: datetime
