from app.core.constants import AUDIT_TRANSITION
from app.services import audit_service
from app.sdk.workflow import (
    ChangeRequestTransitionContext,
    ChangeRequestTransitionHandler,
    register_handler,
)


class NordicSnacksAuditTrailHandler(ChangeRequestTransitionHandler):

    def after_transition(self, context: ChangeRequestTransitionContext) -> None:
        audit_service.log_action(
            entity_id=context.change_request.id,
            entity_type="ChangeRequest",
            action=AUDIT_TRANSITION,
            details="Nordic Snacks customization: "
            + context.from_status.value
            + " -> "
            + context.to_status.value,
        )


register_handler(NordicSnacksAuditTrailHandler())
