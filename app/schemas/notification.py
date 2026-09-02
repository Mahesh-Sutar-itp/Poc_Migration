from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationSchema(BaseModel):
    id: int
    title: str
    message: str | None = None
    link: str | None = None
    category: str
    read: bool
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)
