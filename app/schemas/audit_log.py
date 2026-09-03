from datetime import datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema


class AuditLogSchema(BaseSchema):
    id: int
    entityId: int
    entityType: str
    action: str
    performedBy: str | None = None
    details: str | None = None
    performedAt: datetime
