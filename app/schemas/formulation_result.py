from datetime import datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class FormulationResultSchema(CamelModel):
    id: int
    chain_id: str
    status: str
    computed_values: dict[str, float] | None = None
    nutri_score: str | None = None
    eco_score: str | None = None
    total_cost: float | None = None
    errors: str | None = None
    warnings: str | None = None
    formulated_at: datetime
