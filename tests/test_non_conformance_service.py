import pytest
from unittest.mock import MagicMock, patch

from app.core.exceptions import FormCraftException
from app.models.corrective_action import CorrectiveAction
from app.models.non_conformance import NonConformance
from app.models.product import Product
from app.services import non_conformance_service


class TestNonConformanceService:
    """Port of NonConformanceServiceTest.java — 5 tests."""

    def setup_method(self):
        self.product = Product()
        self.product.id = 9
        self.product.name = "Chocolate Brownie"

        self.nc = NonConformance()
        self.nc.id = 1
        self.nc.product_id = 9
        self.nc.product = self.product
        self.nc.severity = "MAJOR"
        self.nc.status = "IN_PROGRESS"

    @patch("app.services.non_conformance_service.notification_service")
    @patch("app.services.non_conformance_service.product_repository")
    @patch("app.services.non_conformance_service.non_conformance_repository")
    def test_raise_creates_open_nc(self, mock_nc_repo, mock_prod_repo, mock_notif):
        mock_prod_repo.find_by_id.return_value = self.product
        mock_nc_repo.save.side_effect = lambda db, nc: nc
        db = MagicMock()
        created = non_conformance_service.raise_nc(db, 9, "Undeclared allergen", "Milk not declared", "CRITICAL", "quality")
        assert created.status == "OPEN"
        assert created.severity == "CRITICAL"

    @patch("app.services.non_conformance_service.corrective_action_repository")
    @patch("app.services.non_conformance_service.non_conformance_repository")
    def test_close_fails_with_open_capa(self, mock_nc_repo, mock_ca_repo):
        mock_nc_repo.find_by_id.return_value = self.nc
        mock_ca_repo.count_by_nc_and_status.return_value = 1
        with pytest.raises(FormCraftException, match="still open"):
            non_conformance_service.transition_status(MagicMock(), 1, "CLOSED")

    @patch("app.services.non_conformance_service.corrective_action_repository")
    @patch("app.services.non_conformance_service.non_conformance_repository")
    def test_close_succeeds_with_no_open_capa(self, mock_nc_repo, mock_ca_repo):
        mock_nc_repo.find_by_id.return_value = self.nc
        mock_ca_repo.count_by_nc_and_status.return_value = 0
        mock_nc_repo.save.side_effect = lambda db, nc: nc
        db = MagicMock()
        closed = non_conformance_service.transition_status(db, 1, "CLOSED")
        assert closed.status == "CLOSED"
        assert closed.closed_at is not None

    @patch("app.services.non_conformance_service.non_conformance_repository")
    def test_cannot_add_action_to_closed_nc(self, mock_nc_repo):
        self.nc.status = "CLOSED"
        mock_nc_repo.find_by_id.return_value = self.nc
        with pytest.raises(FormCraftException):
            non_conformance_service.add_corrective_action(MagicMock(), 1, "Retrain staff", "quality", None)

    @patch("app.services.non_conformance_service.corrective_action_repository")
    def test_close_action_rejects_mismatched_nc(self, mock_ca_repo):
        action = CorrectiveAction()
        action.id = 5
        other_nc = NonConformance()
        other_nc.id = 2
        action.non_conformance_id = 2
        action.non_conformance = other_nc
        mock_ca_repo.find_by_id.return_value = action
        with pytest.raises(FormCraftException, match="does not belong"):
            non_conformance_service.close_corrective_action(MagicMock(), 1, 5)
