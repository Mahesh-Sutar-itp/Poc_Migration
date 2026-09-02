import pytest
from unittest.mock import MagicMock, patch
from decimal import Decimal

from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.models.product import Product
from app.services import product_service


class TestProductService:
    """Port of ProductServiceTest.java — 8 tests."""

    def setup_method(self):
        self.product = Product()
        self.product.id = 1
        self.product.code = "FP-TEST"
        self.product.name = "Test Product"
        self.product.product_type = "FINISHED_PRODUCT"
        self.product.state = "DRAFT"

    @patch("app.services.product_service.audit_service")
    @patch("app.services.product_service.product_repository")
    def test_create_product_success(self, mock_repo, mock_audit):
        mock_repo.exists_by_code.return_value = False
        mock_repo.save.return_value = self.product
        db = MagicMock()
        result = product_service.create_product(db, self.product)
        assert result.code == "FP-TEST"
        assert result.state == "DRAFT"

    @patch("app.services.product_service.product_repository")
    def test_create_product_duplicate_code_throws(self, mock_repo):
        mock_repo.exists_by_code.return_value = True
        with pytest.raises(FormCraftException, match="FP-TEST"):
            product_service.create_product(MagicMock(), self.product)

    @patch("app.services.product_service.product_repository")
    def test_get_by_id_unknown_throws(self, mock_repo):
        mock_repo.find_by_id.return_value = None
        with pytest.raises(EntityNotFoundException, match="99"):
            product_service.get_by_id(MagicMock(), 99)

    @patch("app.services.product_service.product_repository")
    def test_update_validated_product_throws(self, mock_repo):
        self.product.state = "VALIDATED"
        mock_repo.find_by_id.return_value = self.product
        with pytest.raises(FormCraftException, match="validated product"):
            product_service.update_product(MagicMock(), 1, name="Updated")

    @patch("app.services.product_service.product_repository")
    def test_delete_validated_product_throws(self, mock_repo):
        self.product.state = "VALIDATED"
        mock_repo.find_by_id.return_value = self.product
        with pytest.raises(FormCraftException, match="VALIDATED"):
            product_service.delete_product(MagicMock(), 1)

    @patch("app.services.product_service.product_repository")
    def test_delete_in_validation_throws(self, mock_repo):
        self.product.state = "IN_VALIDATION"
        mock_repo.find_by_id.return_value = self.product
        with pytest.raises(FormCraftException, match="IN_VALIDATION"):
            product_service.delete_product(MagicMock(), 1)

    @patch("app.services.product_service.composition_line_repository")
    @patch("app.services.product_service.product_repository")
    def test_delete_product_used_as_ingredient_throws(self, mock_repo, mock_cl):
        self.product.state = "DRAFT"
        mock_repo.find_by_id.return_value = self.product
        mock_cl.exists_by_ingredient_id.return_value = True
        with pytest.raises(FormCraftException, match="ingredient"):
            product_service.delete_product(MagicMock(), 1)

    @patch("app.services.product_service.audit_service")
    @patch("app.services.product_service.composition_line_repository")
    @patch("app.services.product_service.product_repository")
    def test_delete_draft_succeeds(self, mock_repo, mock_cl, mock_audit):
        self.product.state = "DRAFT"
        mock_repo.find_by_id.return_value = self.product
        mock_cl.exists_by_ingredient_id.return_value = False
        db = MagicMock()
        product_service.delete_product(db, 1)
        mock_repo.delete.assert_called_once()
