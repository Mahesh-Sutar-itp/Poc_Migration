from app.core.exceptions import FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.sdk.workflow import (
    ChangeRequestTransitionContext,
    ChangeRequestTransitionHandler,
    register_handler,
)


class NordicSnacksImpactNotesHandler(ChangeRequestTransitionHandler):

    def before_transition(self, context: ChangeRequestTransitionContext) -> None:
        if context.to_status != ChangeRequestStatus.SUBMITTED:
            return

        impact = context.change_request.impact
        if impact is not None and impact.strip():
            return

        raise FormCraftException(
            "Change requests must document their impact before submission"
        )


register_handler(NordicSnacksImpactNotesHandler())
