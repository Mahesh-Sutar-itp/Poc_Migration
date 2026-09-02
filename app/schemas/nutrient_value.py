from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NutrientValueSchema(BaseModel):
    id: int
    nutrientType: str
    valuePer100g: float
    unit: str | None = None

    model_config = ConfigDict(from_attributes=True)
