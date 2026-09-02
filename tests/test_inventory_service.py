import pytest
from unittest.mock import MagicMock, patch
from decimal import Decimal

from app.core.exceptions import FormCraftException
from app.models.product import Product
from app.models.stock_lot import StockLot
from app.services import inventory_service


class TestInventoryService:
    """Port of InventoryServiceTest.java — 4 tests."""

    def setup_method(self):
        self.product = Product()
        self.product.id = 1
        self.product.name = "Wheat Flour"

        self.lot = StockLot()
        self.lot.id = 1
        self.lot.product_id = 1
        self.lot.product = self.product
        self.lot.lot_number = "LOT-001"
        self.lot.quantity_on_hand = Decimal("100")
        self.lot.unit = "kg"
        self.lot.status = "ACTIVE"

    @patch("app.services.inventory_service.notification_service")
    @patch("app.services.inventory_service.stock_movement_repository")
    @patch("app.services.inventory_service.stock_lot_repository")
    def test_consume_reduces_quantity(self, mock_lot_repo, mock_mv_repo, mock_notif):
        mock_lot_repo.find_by_id.return_value = self.lot
        mock_lot_repo.save.return_value = self.lot
        mock_mv_repo.save.side_effect = lambda db, m: m
        db = MagicMock()
        movement = inventory_service.consume(db, 1, Decimal("40"), "operator", "Batch #1")
        assert self.lot.quantity_on_hand == Decimal("60")
        assert movement.quantity == Decimal("40")

    @patch("app.services.inventory_service.stock_lot_repository")
    def test_consume_throws_when_insufficient(self, mock_lot_repo):
        mock_lot_repo.find_by_id.return_value = self.lot
        with pytest.raises(FormCraftException, match="Insufficient stock"):
            inventory_service.consume(MagicMock(), 1, Decimal("500"), "operator", "Batch #2")

    @patch("app.services.inventory_service.stock_lot_repository")
    def test_adjust_rejects_negative_result(self, mock_lot_repo):
        mock_lot_repo.find_by_id.return_value = self.lot
        with pytest.raises(FormCraftException, match="negative stock"):
            inventory_service.adjust(MagicMock(), 1, Decimal("-200"), "operator", "correction")

    @patch("app.services.inventory_service.stock_movement_repository")
    @patch("app.services.inventory_service.stock_lot_repository")
    def test_adjust_applies_positive_delta(self, mock_lot_repo, mock_mv_repo):
        mock_lot_repo.find_by_id.return_value = self.lot
        mock_lot_repo.save.return_value = self.lot
        mock_mv_repo.save.side_effect = lambda db, m: m
        db = MagicMock()
        inventory_service.adjust(db, 1, Decimal("10"), "operator", "count correction")
        assert self.lot.quantity_on_hand == Decimal("110")
