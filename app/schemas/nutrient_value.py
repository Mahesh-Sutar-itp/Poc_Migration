from datetime import datetime

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema


class NutrientValueSchema(BaseSchema):
    id: int
    nutrientType: str
    valuePer100g: float
    unit: str | None = None
