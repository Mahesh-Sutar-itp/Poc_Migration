from datetime import datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class NutrientValueSchema(CamelModel):
    id: int
    nutrient_type: str
    value_per_100g: float
    unit: str | None = None
