from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QualityCheckSchema(BaseModel):
    id: int
    checkType: str
    result: str | None = None
    status: str
    checkedBy: str | None = None
    checkedAt: datetime

    model_config = ConfigDict(from_attributes=True)
