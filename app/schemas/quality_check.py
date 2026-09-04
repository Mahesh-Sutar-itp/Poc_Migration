from datetime import datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class QualityCheckSchema(CamelModel):
    id: int
    check_type: str
    result: str | None = None
    status: str
    checked_by: str | None = None
    checked_at: datetime
