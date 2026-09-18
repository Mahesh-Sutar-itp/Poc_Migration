from __future__ import annotations

from dataclasses import dataclass

from app.enums.change_request_status import ChangeRequestStatus
from app.models.change_request import ChangeRequest


@dataclass(frozen=True)
class ChangeRequestTransitionContext:
    """Customization Gate 1 — the payload handed to every registered
    ChangeRequestTransitionHandler around a ChangeRequest status transition
    (Teamcenter-style workflow rule handler)."""

    change_request: ChangeRequest
    from_status: ChangeRequestStatus
    to_status: ChangeRequestStatus


class ChangeRequestTransitionHandler:
    """Customization Gate 1 (ITK/workflow-rule-handler style): a client-supplied hook
    that runs around every ChangeRequest status transition. Subclass this and call
    register_handler() with an instance — see app/addons/ — and it runs automatically,
    no core code changes required.

    Raise a FormCraftException from before_transition to veto the transition.
    """

    def before_transition(self, context: ChangeRequestTransitionContext) -> None:
        pass

    def after_transition(self, context: ChangeRequestTransitionContext) -> None:
        pass


_handlers: list[ChangeRequestTransitionHandler] = []


def register_handler(handler: ChangeRequestTransitionHandler) -> None:
    _handlers.append(handler)


def registered_handlers() -> list[ChangeRequestTransitionHandler]:
    return list(_handlers)
