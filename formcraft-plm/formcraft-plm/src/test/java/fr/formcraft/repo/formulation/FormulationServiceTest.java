package fr.formcraft.repo.formulation;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.model.entity.*;
import fr.formcraft.model.enums.NutrientType;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.repo.formulation.impl.*;
import fr.formcraft.repo.jpa.CompositionLineRepository;
import fr.formcraft.repo.jpa.FormulationResultRepository;
import fr.formcraft.repo.jpa.NutrientValueRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.formula.FormulaEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FormulationService unit tests")
class FormulationServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private CompositionLineRepository compositionLineRepository;
    @Mock private FormulationResultRepository formulationResultRepository;
    @Mock private AuditService auditService;
    @Mock private NutrientValueRepository nutrientValueRepository;

    private FormulationService formulationService;

    private Product finishedProduct;
    private Product rawMaterial;
    private CompositionLine compositionLine;

    @BeforeEach
    void setUp() {
        rawMaterial = new Product();
        rawMaterial.setId(1L);
        rawMaterial.setCode("RM-001");
        rawMaterial.setName("Wheat Flour");
        rawMaterial.setProductType(ProductType.RAW_MATERIAL);
        rawMaterial.setCostPerKg(BigDecimal.valueOf(0.80));

        finishedProduct = new Product();
        finishedProduct.setId(2L);
        finishedProduct.setCode("FP-001");
        finishedProduct.setName("Test Brownie");
        finishedProduct.setProductType(ProductType.FINISHED_PRODUCT);
        finishedProduct.setFormulaExpression("protein * 4 + fat * 9 + carbohydrates * 4");
        finishedProduct.setAllergenFlags("GLUTEN");

        compositionLine = new CompositionLine();
        compositionLine.setId(10L);
        compositionLine.setProduct(finishedProduct);
        compositionLine.setIngredient(rawMaterial);
        compositionLine.setQuantity(BigDecimal.valueOf(100));
        compositionLine.setUnit("%");

        FormulaEvaluationService formulaService = new FormulaEvaluationService();
        NutritionalFormulationHandler nutritionalHandler = new NutritionalFormulationHandler(nutrientValueRepository);
        CostFormulationHandler costHandler = new CostFormulationHandler();
        ComplianceFormulationHandler complianceHandler = new ComplianceFormulationHandler();
        ScoreFormulationHandler scoreHandler = new ScoreFormulationHandler(formulaService);

        formulationService = new FormulationServiceImpl(
                productRepository, compositionLineRepository, formulationResultRepository,
                auditService, nutritionalHandler, costHandler, complianceHandler, scoreHandler);
    }

    @Test
    @DisplayName("shouldFormulate returns false for raw materials")
    void shouldNotFormulateRawMaterial() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(rawMaterial));

        assertThat(formulationService.shouldFormulate(1L)).isFalse();
    }

    @Test
    @DisplayName("shouldFormulate returns true for finished products")
    void shouldFormulateFinishedProduct() {
        when(productRepository.findById(2L)).thenReturn(Optional.of(finishedProduct));

        assertThat(formulationService.shouldFormulate(2L)).isTrue();
    }

    @Test
    @DisplayName("formulate throws EntityNotFoundException for unknown product")
    void formulateUnknownProductThrows() {
        when(productRepository.findByIdWithComposition(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> formulationService.formulate(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("formulate computes nutritional values for finished product with composition")
    void formulateComputesNutritionalValues() {
        when(productRepository.findByIdWithComposition(2L)).thenReturn(Optional.of(finishedProduct));
        when(productRepository.findById(2L)).thenReturn(Optional.of(finishedProduct));
        when(compositionLineRepository.findByProductIdWithIngredient(2L))
                .thenReturn(List.of(compositionLine));
        when(formulationResultRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Protein 10.3g per 100g, quantity fraction = 1.0 (100%)
        NutrientValue proteinValue = new NutrientValue();
        proteinValue.setNutrientType(NutrientType.PROTEIN);
        proteinValue.setValuePer100g(BigDecimal.valueOf(10.3));

        when(nutrientValueRepository.findByProductIdAndNutrientType(eq(1L), any()))
                .thenReturn(Optional.empty());
        when(nutrientValueRepository.findByProductIdAndNutrientType(1L, NutrientType.PROTEIN))
                .thenReturn(Optional.of(proteinValue));

        Product result = formulationService.formulate(2L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);
        verify(formulationResultRepository, times(1)).save(any(FormulationResult.class));
        verify(auditService, times(1)).logFormulation(eq(2L), anyString(), anyString());
    }

    @Test
    @DisplayName("formulate with empty composition generates warning")
    void formulateEmptyCompositionGeneratesWarning() {
        when(productRepository.findByIdWithComposition(2L)).thenReturn(Optional.of(finishedProduct));
        when(productRepository.findById(2L)).thenReturn(Optional.of(finishedProduct));
        when(compositionLineRepository.findByProductIdWithIngredient(2L)).thenReturn(List.of());
        when(formulationResultRepository.save(any())).thenAnswer(inv -> {
            FormulationResult r = inv.getArgument(0);
            assertThat(r.getWarnings()).contains("no composition lines");
            return r;
        });

        formulationService.formulate(2L, FormulationService.DEFAULT_CHAIN_ID);
    }
}
