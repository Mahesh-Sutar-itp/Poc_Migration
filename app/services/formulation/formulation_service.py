from __future__ import annotations

import logging
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_CHAIN_ID, FAST_CHAIN_ID
from app.core.exceptions import EntityNotFoundException, FormulationException
from app.enums.product_type import ProductType
from app.models.formulation_result import FormulationResult
from app.repositories import composition_line_repository, formulation_result_repository, product_repository
from app.services import audit_service
from app.services.formulation.compliance_handler import ComplianceFormulationHandler
from app.services.formulation.cost_handler import CostFormulationHandler
from app.services.formulation.formulation_context import FormulationContext
from app.services.formulation.nutritional_handler import NutritionalFormulationHandler
from app.services.formulation.score_handler import ScoreFormulationHandler

logger = logging.getLogger(__name__)


def _build_default_chain(db: Session) -> list:
    nutritional = NutritionalFormulationHandler(db)
    cost = CostFormulationHandler()
    compliance = ComplianceFormulationHandler()
    score = ScoreFormulationHandler()

    handlers = [nutritional, cost, compliance, score]
    for i in range(len(handlers) - 1):
        handlers[i].set_next(handlers[i + 1])
    return handlers


def formulate(db: Session, product_id: int, chain_id: str = DEFAULT_CHAIN_ID, performed_by: str | None = None):
    logger.debug(f"Starting formulation for product={product_id} chain={chain_id}")

    product = product_repository.find_by_id_with_composition(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)

    if product.product_type == ProductType.RAW_MATERIAL.value:
        logger.info(f"Skipping formulation for raw material product={product_id}")
        return product

    lines = composition_line_repository.find_by_product_id_with_ingredient(db, product_id)
    context = FormulationContext(product=product, chain_id=chain_id, composition_lines=lines)

    _run_chain(db, context, chain_id)

    result = _build_result(product, context)
    formulation_result_repository.save(db, result)
    db.commit()

    audit_service.log_formulation(product_id, chain_id, context.status, performed_by)

    logger.debug(f"Formulation completed for product={product_id} status={context.status}")
    return product


def _run_chain(db: Session, context: FormulationContext, chain_id: str) -> None:
    handlers = _build_default_chain(db)

    if chain_id == FAST_CHAIN_ID:
        # PORTED-AS-IS: fast chain truncation never takes effect in the source.
        # The fast path is supposed to run only the first two stages, but each handler
        # also holds a pointer to the next and calls it directly, so the truncation
        # never takes effect.
        handlers = handlers[:2]

    for handler in handlers:
        if context.aborted:
            logger.warning(f"Formulation chain aborted at handler={handler.handler_name}")
            break
        try:
            handler.handle(context)
        except FormulationException as e:
            context.add_error(f"Handler {handler.handler_name} failed: {e.message}")
            context.aborted = True


def _build_result(product, context: FormulationContext) -> FormulationResult:
    result = FormulationResult()
    result.product_id = product.id
    result.product = product
    result.chain_id = context.chain_id
    result.status = context.status
    result.computed_values = context.computed_nutrients
    result.nutri_score = context.nutri_score
    result.eco_score = context.eco_score
    result.total_cost = Decimal(str(context.total_cost))
    result.errors = context.errors_summary if context.has_errors() else None
    result.warnings = context.warnings_summary if context.warnings else None
    return result
