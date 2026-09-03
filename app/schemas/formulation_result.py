from datetime import datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema


class FormulationResultSchema(BaseSchema):
    id: int
    chainId: str
    status: str
    computedValues: dict[str, float] | None = None
    nutriScore: str | None = None
    ecoScore: str | None = None
    totalCost: float | None = None
    errors: str | None = None
    warnings: str | None = None
    formulatedAt: datetime
