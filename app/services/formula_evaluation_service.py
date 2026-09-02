import logging

from simpleeval import simple_eval, InvalidExpression

from app.core.exceptions import FormCraftException

logger = logging.getLogger(__name__)

SAFE_NAMES = {
    "protein": 0.0, "fat": 0.0, "carbohydrates": 0.0,
    "fiber": 0.0, "salt": 0.0, "energy": 0.0,
}


def evaluate(expression: str, variables: dict[str, object]) -> float:
    if not expression or not expression.strip():
        raise FormCraftException("Formula expression must not be blank")

    logger.debug(f"Evaluating expression: '{expression}' with variables={list(variables.keys())}")

    try:
        result = simple_eval(expression, names=variables)
        if result is None:
            raise FormCraftException(f"Expression returned null result: {expression}")
        return float(result)
    except FormCraftException:
        raise
    except Exception as e:
        raise FormCraftException(f"Failed to evaluate formula '{expression}': {e}")


def is_valid_expression(expression: str) -> bool:
    if not expression or not expression.strip():
        return False
    try:
        simple_eval(expression, names=SAFE_NAMES)
        return True
    except Exception:
        return False
