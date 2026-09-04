from datetime import datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class AuditLogSchema(CamelModel):
    id: int
    entity_id: int
    entity_type: str
    action: str
    performed_by: str | None = None
    details: str | None = None
    performed_at: datetime
