from datetime import datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema


class QualityCheckSchema(BaseSchema):
    id: int
    checkType: str
    result: str | None = None
    status: str
    checkedBy: str | None = None
    checkedAt: datetime
