from app.core.exceptions import FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.sdk.workflow import (
    ChangeRequestTransitionContext,
    ChangeRequestTransitionHandler,
    register_handler,
)

MINIMUM_REASON_LENGTH = 40


class NordicSnacksHighImpactJustificationHandler(ChangeRequestTransitionHandler):

    def before_transition(self, context: ChangeRequestTransitionContext) -> None:
        if context.to_status != ChangeRequestStatus.SUBMITTED:
            return

        cr = context.change_request
        product = cr.product

        impact = cr.impact or ""
        flagged_high_impact = "high" in impact.lower()

        touches_flagged_finished_product = (
            product is not None
            and product.is_finished_product
            and product.allergen_flags is not None
            and product.allergen_flags.strip() != ""
        )

        if not flagged_high_impact and not touches_flagged_finished_product:
            return

        reason = cr.reason
        if reason is not None and len(reason.strip()) >= MINIMUM_REASON_LENGTH:
            return

        raise FormCraftException(
            "High-impact change requests need a reason of at least"
            " 40 characters before submission"
        )


register_handler(NordicSnacksHighImpactJustificationHandler())
