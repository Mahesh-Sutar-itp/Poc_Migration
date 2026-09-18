from datetime import datetime, timedelta

from app.core.exceptions import FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.sdk.workflow import (
    ChangeRequestTransitionContext,
    ChangeRequestTransitionHandler,
    register_handler,
)

MINIMUM_REVIEW_WINDOW = timedelta(hours=4)


class NordicSnacksMinimumReviewWindowHandler(ChangeRequestTransitionHandler):

    def before_transition(self, context: ChangeRequestTransitionContext) -> None:
        if context.to_status != ChangeRequestStatus.APPROVED:
            return

        requested_at = context.change_request.requested_at
        if requested_at is None:
            return

        elapsed = datetime.now() - requested_at
        if elapsed < MINIMUM_REVIEW_WINDOW:
            remaining = MINIMUM_REVIEW_WINDOW - elapsed
            remaining_minutes = max(int(remaining.total_seconds() // 60), 1)
            raise FormCraftException(
                "Change requests need at least a 4-hour review window"
                f" before approval ({remaining_minutes} minute(s) remaining)"
            )


register_handler(NordicSnacksMinimumReviewWindowHandler())
