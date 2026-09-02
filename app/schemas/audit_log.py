from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogSchema(BaseModel):
    id: int
    entityId: int
    entityType: str
    action: str
    performedBy: str | None = None
    details: str | None = None
    performedAt: datetime

    model_config = ConfigDict(from_attributes=True)
