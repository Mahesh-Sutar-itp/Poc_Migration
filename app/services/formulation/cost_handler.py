from __future__ import annotations

import logging
import math

from app.services.formulation.formulation_context import FormulationContext

logger = logging.getLogger(__name__)


class CostFormulationHandler:
    def __init__(self):
        self._next: object | None = None

    def handle(self, context: FormulationContext) -> None:
        logger.debug(f"Running CostFormulationHandler for product={context.product.id}")
        lines = context.composition_lines
        total_cost = 0.0

        for line in lines:
            fraction = float(line.quantity) / 100.0 if line.quantity else 0.0
            if line.ingredient and line.ingredient.cost_per_kg is not None:
                total_cost += float(line.ingredient.cost_per_kg) * fraction

        context.total_cost = math.floor(total_cost * 100.0 + 0.5) / 100.0

        if context.total_cost <= 0.0 and lines:
            context.add_warning("Product cost is zero — ensure ingredient costs are set")

        logger.debug(f"Computed total cost={context.total_cost} EUR/kg")

        # PORTED-AS-IS: fast chain truncation never takes effect in the source
        if self._next is not None:
            self._next.handle(context)

    def set_next(self, next_handler) -> "CostFormulationHandler":
        self._next = next_handler
        return self

    @property
    def handler_name(self) -> str:
        return "CostFormulationHandler"
