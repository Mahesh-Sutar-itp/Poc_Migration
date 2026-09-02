import pytest
from unittest.mock import MagicMock, patch

from app.core.exceptions import FormCraftException
from app.models.product import Product
from app.services import workflow_service


class TestWorkflowService:
    """Port of WorkflowServiceTest.java — 3 tests."""

    def setup_method(self):
        self.product = Product()
        self.product.id = 1
        self.product.code = "FP-001"
        self.product.name = "Test Product"
        self.product.product_type = "FINISHED_PRODUCT"
        self.product.state = "DRAFT"

    @patch("app.services.workflow_service.audit_service")
    @patch("app.services.workflow_service.workflow_task_repository")
    @patch("app.services.workflow_service.product_repository")
    def test_submit_for_validation_success(self, mock_repo, mock_task_repo, mock_audit):
        mock_repo.find_by_id.return_value = self.product
        mock_repo.save.return_value = self.product
        mock_task_repo.find_by_product_id_and_status.return_value = []
        mock_task_repo.save.return_value = MagicMock()
        db = MagicMock()
        result = workflow_service.submit_for_validation(db, 1, "reviewer")
        assert result.state == "IN_VALIDATION"

    @patch("app.services.workflow_service.product_repository")
    def test_invalid_transition_throws(self, mock_repo):
        self.product.state = "DRAFT"
        mock_repo.find_by_id.return_value = self.product
        with pytest.raises(FormCraftException, match="Invalid state transition"):
            workflow_service.transition_state(MagicMock(), 1, "ARCHIVED")

    @patch("app.services.workflow_service.audit_service")
    @patch("app.services.workflow_service.workflow_task_repository")
    @patch("app.services.workflow_service.product_repository")
    def test_approve_success(self, mock_repo, mock_task_repo, mock_audit):
        self.product.state = "IN_VALIDATION"
        mock_repo.find_by_id.return_value = self.product
        mock_repo.save.return_value = self.product
        mock_task_repo.find_by_product_id_and_status.return_value = []
        db = MagicMock()
        result = workflow_service.approve(db, 1)
        assert result.state == "VALIDATED"
