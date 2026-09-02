import pytest
from unittest.mock import MagicMock, patch, ANY
from decimal import Decimal

from app.core.exceptions import EntityNotFoundException
from app.models.composition_line import CompositionLine
from app.models.formulation_result import FormulationResult
from app.models.nutrient_value import NutrientValue
from app.models.product import Product
from app.services.formulation import formulation_service


class TestFormulationService:
    """Port of FormulationServiceTest.java — 5 tests."""

    def setup_method(self):
        self.raw_material = Product()
        self.raw_material.id = 1
        self.raw_material.code = "RM-001"
        self.raw_material.name = "Wheat Flour"
        self.raw_material.product_type = "RAW_MATERIAL"
        self.raw_material.cost_per_kg = Decimal("0.80")

        self.finished = Product()
        self.finished.id = 2
        self.finished.code = "FP-001"
        self.finished.name = "Test Brownie"
        self.finished.product_type = "FINISHED_PRODUCT"
        self.finished.formula_expression = "protein * 4 + fat * 9 + carbohydrates * 4"
        self.finished.allergen_flags = "GLUTEN"

        self.comp_line = CompositionLine()
        self.comp_line.id = 10
        self.comp_line.product_id = 2
        self.comp_line.ingredient_id = 1
        self.comp_line.ingredient = self.raw_material
        self.comp_line.quantity = Decimal("100")
        self.comp_line.unit = "%"

    @patch("app.services.formulation.formulation_service.product_repository")
    def test_should_not_formulate_raw_material(self, mock_repo):
        mock_repo.find_by_id.return_value = self.raw_material
        # Raw materials should be skipped
        mock_repo.find_by_id_with_composition.return_value = self.raw_material
        result = formulation_service.formulate(MagicMock(), 1, "default")
        assert result.product_type == "RAW_MATERIAL"

    @patch("app.services.formulation.formulation_service.product_repository")
    def test_formulate_unknown_product_throws(self, mock_repo):
        mock_repo.find_by_id_with_composition.return_value = None
        with pytest.raises(EntityNotFoundException, match="99"):
            formulation_service.formulate(MagicMock(), 99, "default")

    @patch("app.services.formulation.formulation_service.audit_service")
    @patch("app.services.formulation.formulation_service.formulation_result_repository")
    @patch("app.services.formulation.formulation_service.composition_line_repository")
    @patch("app.services.formulation.formulation_service.product_repository")
    @patch("app.services.formulation.nutritional_handler.nutrient_value_repository")
    def test_formulate_computes_values(self, mock_nv_repo, mock_prod_repo, mock_cl_repo, mock_fr_repo, mock_audit):
        mock_prod_repo.find_by_id_with_composition.return_value = self.finished
        mock_cl_repo.find_by_product_id_with_ingredient.return_value = [self.comp_line]
        mock_fr_repo.save.side_effect = lambda db, r: r

        protein_nv = NutrientValue()
        protein_nv.nutrient_type = "PROTEIN"
        protein_nv.value_per_100g = Decimal("10.3")
        mock_nv_repo.find_by_product_and_type.return_value = None
        mock_nv_repo.find_by_product_and_type.side_effect = lambda db, pid, nt: protein_nv if nt == "PROTEIN" else None

        db = MagicMock()
        result = formulation_service.formulate(db, 2, "default")
        assert result is not None
        assert result.id == 2
        mock_fr_repo.save.assert_called_once()

    @patch("app.services.formulation.formulation_service.audit_service")
    @patch("app.services.formulation.formulation_service.formulation_result_repository")
    @patch("app.services.formulation.formulation_service.composition_line_repository")
    @patch("app.services.formulation.formulation_service.product_repository")
    @patch("app.services.formulation.nutritional_handler.nutrient_value_repository")
    def test_formulate_empty_composition_generates_warning(self, mock_nv_repo, mock_prod_repo, mock_cl_repo, mock_fr_repo, mock_audit):
        mock_prod_repo.find_by_id_with_composition.return_value = self.finished
        mock_cl_repo.find_by_product_id_with_ingredient.return_value = []
        saved_results = []
        def capture(db, r):
            saved_results.append(r)
            return r
        mock_fr_repo.save.side_effect = capture

        db = MagicMock()
        formulation_service.formulate(db, 2, "default")
        assert len(saved_results) == 1
        assert "no composition lines" in (saved_results[0].warnings or "")
