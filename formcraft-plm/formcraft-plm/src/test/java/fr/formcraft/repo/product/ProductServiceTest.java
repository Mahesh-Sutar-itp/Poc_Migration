package fr.formcraft.repo.product;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.jpa.CompositionLineRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.product.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService unit tests")
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private CompositionLineRepository compositionLineRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setCode("FP-TEST");
        testProduct.setName("Test Product");
        testProduct.setProductType(ProductType.FINISHED_PRODUCT);
        testProduct.setState(ProductState.DRAFT);
    }

    @Test
    @DisplayName("createProduct saves and returns new product")
    void createProductSuccess() {
        when(productRepository.existsByCode("FP-TEST")).thenReturn(false);
        when(productRepository.save(any())).thenReturn(testProduct);

        Product result = productService.createProduct(testProduct);

        assertThat(result).isNotNull();
        assertThat(result.getCode()).isEqualTo("FP-TEST");
        assertThat(result.getState()).isEqualTo(ProductState.DRAFT);
        verify(productRepository).save(testProduct);
        verify(auditService).logCreate(eq(1L), anyString());
    }

    @Test
    @DisplayName("createProduct throws when code already exists")
    void createProductDuplicateCodeThrows() {
        when(productRepository.existsByCode("FP-TEST")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(testProduct))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("FP-TEST");
    }

    @Test
    @DisplayName("getById throws EntityNotFoundException for unknown id")
    void getByIdUnknownThrows() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getById(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("updateProduct throws when product is VALIDATED")
    void updateValidatedProductThrows() {
        testProduct.setState(ProductState.VALIDATED);
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        Product updates = new Product();
        updates.setName("Updated Name");

        assertThatThrownBy(() -> productService.updateProduct(1L, updates))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("validated product");
    }

    @Test
    @DisplayName("deleteProduct throws when product is VALIDATED")
    void deleteValidatedProductThrows() {
        testProduct.setState(ProductState.VALIDATED);
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        assertThatThrownBy(() -> productService.deleteProduct(1L))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("validated");
    }
}
