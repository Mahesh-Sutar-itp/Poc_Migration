from __future__ import annotations

import logging
import math

from app.core.constants import (
    NUTRI_SCORE_A, NUTRI_SCORE_B, NUTRI_SCORE_C, NUTRI_SCORE_D, NUTRI_SCORE_E,
)
from app.services.formulation.formulation_context import FormulationContext
from app.services import formula_evaluation_service

logger = logging.getLogger(__name__)


class ScoreFormulationHandler:
    def __init__(self):
        self._next: object | None = None

    def handle(self, context: FormulationContext) -> None:
        logger.debug(f"Running ScoreFormulationHandler for product={context.product.id}")
        self._compute_nutri_score(context)
        self._evaluate_formula_expression(context)

        if self._next is not None:
            self._next.handle(context)

    def set_next(self, next_handler) -> "ScoreFormulationHandler":
        self._next = next_handler
        return self

    @property
    def handler_name(self) -> str:
        return "ScoreFormulationHandler"

    def _compute_nutri_score(self, context: FormulationContext) -> None:
        energy = context.get_nutrient("ENERGY_KCAL") / 335.0 * 10
        saturated_fat = context.get_nutrient("SATURATED_FAT") / 10.0 * 10
        sugars = context.get_nutrient("SUGARS") / 45.0 * 10
        salt = context.get_nutrient("SALT") / 6.0 * 10
        fiber = min(context.get_nutrient("FIBER") / 4.7 * 5, 5)
        protein = min(context.get_nutrient("PROTEIN") / 8.0 * 5, 5)

        score = (energy + saturated_fat + sugars + salt) - (fiber + protein)

        grade = self._compute_grade(score)
        context.nutri_score = grade
        context.put_nutrient("NUTRI_SCORE_POINTS", math.floor(score * 10.0 + 0.5) / 10.0)

        logger.debug(f"NutriScore computed: score={score} grade={grade}")

    def _compute_grade(self, score: float) -> str:
        if score <= -1:
            return NUTRI_SCORE_A
        if score <= 2:
            return NUTRI_SCORE_B
        if score <= 10:
            return NUTRI_SCORE_C
        if score <= 18:
            return NUTRI_SCORE_D
        return NUTRI_SCORE_E

    def _evaluate_formula_expression(self, context: FormulationContext) -> None:
        expression = context.product.formula_expression
        if not expression or not expression.strip():
            return

        try:
            variables = {
                "protein": context.get_nutrient("PROTEIN"),
                "fat": context.get_nutrient("FAT"),
                "carbohydrates": context.get_nutrient("CARBOHYDRATES"),
                "fiber": context.get_nutrient("FIBER"),
                "salt": context.get_nutrient("SALT"),
                "energy": context.get_nutrient("ENERGY_KCAL"),
            }
            result = formula_evaluation_service.evaluate(expression, variables)
            context.formula_result = result
            context.put_nutrient("FORMULA_RESULT", result)
            logger.debug(f"Formula '{expression}' evaluated to {result}")
        except Exception as e:
            # Swallow into warning (behaviour parity with Java)
            logger.error(f"Formula evaluation failed for product={context.product.code} expression='{expression}': {e}")
            context.add_warning(f"Formula evaluation failed for expression='{expression}': {e}")
