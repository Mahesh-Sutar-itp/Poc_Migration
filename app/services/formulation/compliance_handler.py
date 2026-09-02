from __future__ import annotations

import logging

from app.core.constants import (
    ALLERGEN_EGGS, ALLERGEN_FISH, ALLERGEN_GLUTEN, ALLERGEN_MILK,
    ALLERGEN_NUTS, ALLERGEN_SESAME, ALLERGEN_SHELLFISH, ALLERGEN_SOY,
)
from app.services.formulation.formulation_context import FormulationContext

logger = logging.getLogger(__name__)

REGULATED_ALLERGENS = [
    ALLERGEN_GLUTEN, ALLERGEN_EGGS, ALLERGEN_MILK, ALLERGEN_NUTS,
    ALLERGEN_SOY, ALLERGEN_FISH, ALLERGEN_SHELLFISH, ALLERGEN_SESAME,
]


class ComplianceFormulationHandler:
    def __init__(self):
        self._next: object | None = None

    def handle(self, context: FormulationContext) -> None:
        logger.debug(f"Running ComplianceFormulationHandler for product={context.product.id}")
        lines = context.composition_lines
        declared = context.product.allergen_flags or ""

        for allergen in REGULATED_ALLERGENS:
            present = any(
                line.ingredient and line.ingredient.allergen_flags and allergen in line.ingredient.allergen_flags
                for line in lines
            )
            is_declared = allergen in declared

            if present and not is_declared:
                context.add_error(
                    f"Undeclared allergen detected: {allergen} is present in composition but not declared on product label"
                )
            elif not present and is_declared:
                context.add_warning(
                    f"Allergen {allergen} is declared but not found in composition ingredients"
                )

        self._validate_composition_total(context, lines)

        if self._next is not None:
            self._next.handle(context)

    def set_next(self, next_handler) -> "ComplianceFormulationHandler":
        self._next = next_handler
        return self

    @property
    def handler_name(self) -> str:
        return "ComplianceFormulationHandler"

    def _validate_composition_total(self, context: FormulationContext, lines) -> None:
        total_pct = sum(float(line.quantity) / 100.0 for line in lines if line.quantity) * 100.0
        deviation = abs(total_pct - 100.0)

        if deviation > 1.0:
            context.add_error(f"Composition total is {total_pct:.2f}% — must be 100% (deviation: {deviation:.2f}%)")
        elif deviation > 0.01:
            context.add_warning(f"Composition total is {total_pct:.4f}% — minor rounding deviation detected")
