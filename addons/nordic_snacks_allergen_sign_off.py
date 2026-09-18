from app.core.exceptions import FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.sdk.workflow import (
    ChangeRequestTransitionContext,
    ChangeRequestTransitionHandler,
    register_handler,
)

SIGN_OFF_TOKEN = "ALLERGEN-REVIEWED"


class NordicSnacksAllergenSignOffHandler(ChangeRequestTransitionHandler):

    def before_transition(self, context: ChangeRequestTransitionContext) -> None:
        if context.to_status != ChangeRequestStatus.APPROVED:
            return

        cr = context.change_request
        product = cr.product

        product_carries_allergens = (
            product is not None
            and product.allergen_flags is not None
            and product.allergen_flags.strip() != ""
        )

        impact = cr.impact or ""
        impact_lower = impact.lower()
        impact_mentions_allergens = "allergen" in impact_lower or "recipe" in impact_lower

        if not product_carries_allergens and not impact_mentions_allergens:
            return

        comment = cr.decision_comment
        if comment is not None and SIGN_OFF_TOKEN in comment.upper():
            return

        raise FormCraftException(
            'Allergen-relevant change requests require a QA sign-off in the'
            ' decision comment (include the token "ALLERGEN-REVIEWED")'
        )


register_handler(NordicSnacksAllergenSignOffHandler())
