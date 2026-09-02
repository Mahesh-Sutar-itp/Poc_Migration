import pytest
from unittest.mock import MagicMock, patch

from app.core.exceptions import FormCraftException
from app.models.change_request import ChangeRequest
from app.models.product import Product
from app.services import change_request_service


class TestChangeRequestService:
    """Port of ChangeRequestServiceTest.java — 4 tests."""

    def setup_method(self):
        self.product = Product()
        self.product.id = 9
        self.product.code = "FP-001"

        self.cr = ChangeRequest()
        self.cr.id = 1
        self.cr.product_id = 9
        self.cr.product = self.product
        self.cr.title = "Reduce sugar content"
        self.cr.status = "DRAFT"
        self.cr.requested_by = "plmmanager"

    @patch("app.services.change_request_service.notification_service")
    @patch("app.services.change_request_service.audit_service")
    @patch("app.services.change_request_service.change_request_repository")
    def test_submit_moves_to_under_review(self, mock_repo, mock_audit, mock_notif):
        mock_repo.find_by_id.return_value = self.cr
        mock_repo.save.side_effect = lambda db, cr: cr
        db = MagicMock()
        result = change_request_service.submit(db, 1)
        assert result.status == "UNDER_REVIEW"

    @patch("app.services.change_request_service.notification_service")
    @patch("app.services.change_request_service.audit_service")
    @patch("app.services.change_request_service.change_request_repository")
    def test_decide_approves_request(self, mock_repo, mock_audit, mock_notif):
        self.cr.status = "UNDER_REVIEW"
        mock_repo.find_by_id.return_value = self.cr
        mock_repo.save.side_effect = lambda db, cr: cr
        db = MagicMock()
        result = change_request_service.decide(db, 1, True, "admin", "Looks good")
        assert result.status == "APPROVED"
        assert result.decided_by == "admin"

    @patch("app.services.change_request_service.change_request_repository")
    def test_decide_on_draft_throws(self, mock_repo):
        mock_repo.find_by_id.return_value = self.cr
        mock_repo.save.side_effect = lambda db, cr: cr
        with pytest.raises(FormCraftException, match="Invalid change request transition"):
            change_request_service.decide(MagicMock(), 1, False, "admin", "Not ready")

    @patch("app.services.change_request_service.change_request_repository")
    def test_implement_requires_approved(self, mock_repo):
        self.cr.status = "DRAFT"
        mock_repo.find_by_id.return_value = self.cr
        mock_repo.save.side_effect = lambda db, cr: cr
        with pytest.raises(FormCraftException):
            change_request_service.implement(MagicMock(), 1)
