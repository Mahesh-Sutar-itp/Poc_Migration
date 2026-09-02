from __future__ import annotations

import logging
import math

from sqlalchemy.orm import Session

from app.enums.nutrient_type import NutrientType
from app.repositories import nutrient_value_repository
from app.services.formulation.formulation_context import FormulationContext

logger = logging.getLogger(__name__)


class NutritionalFormulationHandler:
    def __init__(self, db: Session):
        self._db = db
        self._next: object | None = None

    def handle(self, context: FormulationContext) -> None:
        logger.debug(f"Running NutritionalFormulationHandler for product={context.product.id}")
        lines = context.composition_lines

        if not lines:
            context.add_warning("Product has no composition lines — nutritional values will be zero")

        for nt in NutrientType:
            computed = self._compute_nutrient(lines, nt.value)
            context.put_nutrient(nt.value, computed)

        # PORTED-AS-IS: fast chain truncation never takes effect in the source
        # Each handler calls its next directly, so the fast chain (first 2 handlers)
        # actually runs the full chain because handler.next.handle() chains forward.
        if self._next is not None:
            self._next.handle(context)

    def set_next(self, next_handler) -> "NutritionalFormulationHandler":
        self._next = next_handler
        return self

    @property
    def handler_name(self) -> str:
        return "NutritionalFormulationHandler"

    def _compute_nutrient(self, lines, nutrient_type: str) -> float:
        total = 0.0
        for line in lines:
            ingredient_id = line.ingredient_id
            fraction = float(line.quantity) / 100.0 if line.quantity else 0.0
            nv = nutrient_value_repository.find_by_product_and_type(self._db, ingredient_id, nutrient_type)
            ingredient_value = float(nv.value_per_100g) if nv else 0.0
            total += ingredient_value * fraction
        return math.floor(total * 1000.0 + 0.5) / 1000.0
