from app.core.exceptions import FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.sdk.workflow import ChangeRequestTransitionContext, ChangeRequestTransitionHandler, register_handler


class RequireCommentOnRejectionHandler(ChangeRequestTransitionHandler):
    """Example client extension plugged into Customization Gate 1. Not part of the
    FormCraft core — demonstrates a client-specific rule (Nordic Snacks Co.'s example):
    rejecting a change request requires a decision comment explaining why."""

    def before_transition(self, context: ChangeRequestTransitionContext) -> None:
        if context.to_status == ChangeRequestStatus.REJECTED and _is_blank(context.change_request.decision_comment):
            raise FormCraftException("A decision comment is required when rejecting a change request")


def _is_blank(value: str | None) -> bool:
    return value is None or value.strip() == ""


register_handler(RequireCommentOnRejectionHandler())
