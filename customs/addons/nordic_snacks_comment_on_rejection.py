from app.core.exceptions import FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.sdk.workflow import (
    ChangeRequestTransitionContext,
    ChangeRequestTransitionHandler,
    register_handler,
)


class NordicSnacksCommentOnRejectionHandler(ChangeRequestTransitionHandler):

    def before_transition(self, context: ChangeRequestTransitionContext) -> None:
        if context.to_status != ChangeRequestStatus.REJECTED:
            return

        comment = context.change_request.decision_comment
        if comment is not None and comment.strip():
            return

        raise FormCraftException(
            "A decision comment is required when rejecting a change request"
        )


register_handler(NordicSnacksCommentOnRejectionHandler())
