import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.core.constants import AUDIT_TRANSITION
from app.core.exceptions import FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.sdk import workflow
from app.sdk.workflow import ChangeRequestTransitionContext


@pytest.fixture(autouse=True)
def _clean_handler_registry():
    """Snapshot and restore the handler list so addon registrations don't leak."""
    original = workflow._handlers.copy()
    yield
    workflow._handlers[:] = original


def _make_context(
    *,
    from_status=ChangeRequestStatus.UNDER_REVIEW,
    to_status=ChangeRequestStatus.APPROVED,
    product=None,
    impact=None,
    reason=None,
    decision_comment=None,
    requested_at=None,
    cr_id=1,
):
    cr = MagicMock()
    cr.id = cr_id
    cr.product = product
    cr.impact = impact
    cr.reason = reason
    cr.decision_comment = decision_comment
    cr.requested_at = requested_at
    return ChangeRequestTransitionContext(
        change_request=cr,
        from_status=from_status,
        to_status=to_status,
    )


def _make_product(*, allergen_flags=None, is_finished_product=False):
    product = MagicMock()
    product.allergen_flags = allergen_flags
    product.is_finished_product = is_finished_product
    return product


# ---------------------------------------------------------------------------
# Handler 1: Audit Trail
# ---------------------------------------------------------------------------


class TestAuditTrailHandler:
    def _handler(self):
        from addons.nordic_snacks_audit_trail import NordicSnacksAuditTrailHandler
        return NordicSnacksAuditTrailHandler()

    @patch("addons.nordic_snacks_audit_trail.audit_service")
    def test_log_action_called_with_correct_args(self, mock_audit):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
        )
        self._handler().after_transition(ctx)
        mock_audit.log_action.assert_called_once_with(
            entity_id=ctx.change_request.id,
            entity_type="ChangeRequest",
            action=AUDIT_TRANSITION,
            details="Nordic Snacks customization: DRAFT -> SUBMITTED",
        )

    @patch("addons.nordic_snacks_audit_trail.audit_service")
    def test_fires_on_any_transition(self, mock_audit):
        transitions = [
            (ChangeRequestStatus.SUBMITTED, ChangeRequestStatus.UNDER_REVIEW),
            (ChangeRequestStatus.UNDER_REVIEW, ChangeRequestStatus.APPROVED),
            (ChangeRequestStatus.UNDER_REVIEW, ChangeRequestStatus.REJECTED),
        ]
        handler = self._handler()
        for from_s, to_s in transitions:
            mock_audit.reset_mock()
            ctx = _make_context(from_status=from_s, to_status=to_s)
            handler.after_transition(ctx)
            mock_audit.log_action.assert_called_once()


# ---------------------------------------------------------------------------
# Handler 2: Allergen Sign-Off
# ---------------------------------------------------------------------------


class TestAllergenSignOffHandler:
    def _handler(self):
        from addons.nordic_snacks_allergen_sign_off import NordicSnacksAllergenSignOffHandler
        return NordicSnacksAllergenSignOffHandler()

    def test_passes_when_no_allergen_relevance(self):
        ctx = _make_context(product=_make_product())
        self._handler().before_transition(ctx)  # no exception

    def test_passes_with_token_present(self):
        ctx = _make_context(
            product=_make_product(allergen_flags="GLUTEN,MILK"),
            decision_comment="Approved. ALLERGEN-REVIEWED confirmed.",
        )
        self._handler().before_transition(ctx)

    def test_vetoes_without_token(self):
        ctx = _make_context(
            product=_make_product(allergen_flags="GLUTEN"),
            decision_comment="Looks good",
        )
        with pytest.raises(FormCraftException, match="ALLERGEN-REVIEWED"):
            self._handler().before_transition(ctx)

    def test_vetoes_when_impact_mentions_allergen(self):
        ctx = _make_context(impact="Changes allergen profile")
        with pytest.raises(FormCraftException, match="ALLERGEN-REVIEWED"):
            self._handler().before_transition(ctx)

    def test_vetoes_when_impact_mentions_recipe(self):
        ctx = _make_context(impact="Recipe reformulation")
        with pytest.raises(FormCraftException, match="ALLERGEN-REVIEWED"):
            self._handler().before_transition(ctx)

    def test_skips_non_approved_transition(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.REJECTED,
            product=_make_product(allergen_flags="GLUTEN"),
        )
        self._handler().before_transition(ctx)  # no exception

    def test_vetoes_when_comment_is_none(self):
        ctx = _make_context(
            product=_make_product(allergen_flags="NUTS"),
            decision_comment=None,
        )
        with pytest.raises(FormCraftException, match="ALLERGEN-REVIEWED"):
            self._handler().before_transition(ctx)


# ---------------------------------------------------------------------------
# Handler 3: Minimum Review Window
# ---------------------------------------------------------------------------


class TestMinimumReviewWindowHandler:
    def _handler(self):
        from addons.nordic_snacks_minimum_review_window import NordicSnacksMinimumReviewWindowHandler
        return NordicSnacksMinimumReviewWindowHandler()

    def test_passes_after_4_hours(self):
        ctx = _make_context(requested_at=datetime.now() - timedelta(hours=5))
        self._handler().before_transition(ctx)

    def test_vetoes_before_4_hours(self):
        ctx = _make_context(requested_at=datetime.now() - timedelta(hours=1))
        with pytest.raises(FormCraftException, match="4-hour review window"):
            self._handler().before_transition(ctx)

    def test_remaining_minutes_correct(self):
        ctx = _make_context(requested_at=datetime.now() - timedelta(hours=3))
        with pytest.raises(FormCraftException, match=r"\d+ minute\(s\) remaining"):
            self._handler().before_transition(ctx)

    def test_passes_when_requested_at_is_none(self):
        ctx = _make_context(requested_at=None)
        self._handler().before_transition(ctx)

    def test_skips_non_approved_transition(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.SUBMITTED,
            requested_at=datetime.now(),
        )
        self._handler().before_transition(ctx)


# ---------------------------------------------------------------------------
# Handler 4: Comment on Rejection
# ---------------------------------------------------------------------------


class TestCommentOnRejectionHandler:
    def _handler(self):
        from addons.nordic_snacks_comment_on_rejection import NordicSnacksCommentOnRejectionHandler
        return NordicSnacksCommentOnRejectionHandler()

    def test_passes_with_non_blank_comment(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.REJECTED,
            decision_comment="Not suitable for production",
        )
        self._handler().before_transition(ctx)

    def test_vetoes_with_none_comment(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.REJECTED,
            decision_comment=None,
        )
        with pytest.raises(FormCraftException, match="decision comment is required"):
            self._handler().before_transition(ctx)

    def test_vetoes_with_blank_comment(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.REJECTED,
            decision_comment="   ",
        )
        with pytest.raises(FormCraftException, match="decision comment is required"):
            self._handler().before_transition(ctx)

    def test_ignores_non_rejected_transitions(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.APPROVED,
            decision_comment=None,
        )
        self._handler().before_transition(ctx)


# ---------------------------------------------------------------------------
# Handler 5: High-Impact Justification
# ---------------------------------------------------------------------------


class TestHighImpactJustificationHandler:
    def _handler(self):
        from addons.nordic_snacks_high_impact_justification import NordicSnacksHighImpactJustificationHandler
        return NordicSnacksHighImpactJustificationHandler()

    def test_passes_with_40_char_reason(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            impact="high priority change",
            reason="A" * 40,
        )
        self._handler().before_transition(ctx)

    def test_vetoes_with_short_reason(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            impact="high priority change",
            reason="Too short",
        )
        with pytest.raises(FormCraftException, match="at least 40 characters"):
            self._handler().before_transition(ctx)

    def test_high_impact_via_impact_field(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            impact="HIGH severity",
            reason=None,
        )
        with pytest.raises(FormCraftException, match="at least 40 characters"):
            self._handler().before_transition(ctx)

    def test_high_impact_via_finished_product_with_allergens(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            product=_make_product(allergen_flags="GLUTEN", is_finished_product=True),
            reason="Short",
        )
        with pytest.raises(FormCraftException, match="at least 40 characters"):
            self._handler().before_transition(ctx)

    def test_ignores_non_submitted(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.APPROVED,
            impact="high",
            reason=None,
        )
        self._handler().before_transition(ctx)

    def test_passes_when_not_high_impact(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            impact="low priority",
            reason="Short",
        )
        self._handler().before_transition(ctx)


# ---------------------------------------------------------------------------
# Handler 6: Impact Notes
# ---------------------------------------------------------------------------


class TestImpactNotesHandler:
    def _handler(self):
        from addons.nordic_snacks_impact_notes import NordicSnacksImpactNotesHandler
        return NordicSnacksImpactNotesHandler()

    def test_passes_with_non_blank_impact(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            impact="Changes the recipe formula",
        )
        self._handler().before_transition(ctx)

    def test_vetoes_with_none_impact(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            impact=None,
        )
        with pytest.raises(FormCraftException, match="must document their impact"):
            self._handler().before_transition(ctx)

    def test_vetoes_with_blank_impact(self):
        ctx = _make_context(
            from_status=ChangeRequestStatus.DRAFT,
            to_status=ChangeRequestStatus.SUBMITTED,
            impact="   ",
        )
        with pytest.raises(FormCraftException, match="must document their impact"):
            self._handler().before_transition(ctx)

    def test_ignores_non_submitted(self):
        ctx = _make_context(
            to_status=ChangeRequestStatus.APPROVED,
            impact=None,
        )
        self._handler().before_transition(ctx)
