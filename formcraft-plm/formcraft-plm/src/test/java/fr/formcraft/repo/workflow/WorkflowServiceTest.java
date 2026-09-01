package fr.formcraft.repo.workflow;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.WorkflowTaskRepository;
import fr.formcraft.repo.workflow.impl.WorkflowServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkflowService unit tests")
class WorkflowServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private WorkflowTaskRepository workflowTaskRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private WorkflowServiceImpl workflowService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setCode("FP-001");
        product.setName("Test Product");
        product.setProductType(ProductType.FINISHED_PRODUCT);
        product.setState(ProductState.DRAFT);
    }

    @Test
    @DisplayName("submitForValidation transitions DRAFT to IN_VALIDATION")
    void submitForValidationSuccess() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(workflowTaskRepository.findByProductIdAndStatus(any(), any())).thenReturn(List.of());
        when(workflowTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = workflowService.submitForValidation(1L, "reviewer");

        assertThat(result.getState()).isEqualTo(ProductState.IN_VALIDATION);
        verify(workflowTaskRepository, atLeast(2)).save(any());
    }

    @Test
    @DisplayName("transition fails for invalid state progression")
    void invalidTransitionThrows() {
        product.setState(ProductState.DRAFT);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> workflowService.transitionState(1L, ProductState.ARCHIVED, null))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("Invalid state transition");
    }

    @Test
    @DisplayName("approve transitions IN_VALIDATION to VALIDATED")
    void approveSuccess() {
        product.setState(ProductState.IN_VALIDATION);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(workflowTaskRepository.findByProductIdAndStatus(any(), any())).thenReturn(List.of());

        Product result = workflowService.approve(1L);

        assertThat(result.getState()).isEqualTo(ProductState.VALIDATED);
    }
}
