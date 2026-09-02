package fr.formcraft.repo.nonconformance;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.CorrectiveAction;
import fr.formcraft.model.entity.NonConformance;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.CapaStatus;
import fr.formcraft.model.enums.NcSeverity;
import fr.formcraft.model.enums.NcStatus;
import fr.formcraft.repo.jpa.CorrectiveActionRepository;
import fr.formcraft.repo.jpa.NonConformanceRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.QualityCheckRepository;
import fr.formcraft.repo.nonconformance.impl.NonConformanceServiceImpl;
import fr.formcraft.repo.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("NonConformanceService unit tests")
class NonConformanceServiceTest {

    @Mock private NonConformanceRepository nonConformanceRepository;
    @Mock private CorrectiveActionRepository correctiveActionRepository;
    @Mock private ProductRepository productRepository;
    @Mock private QualityCheckRepository qualityCheckRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private NonConformanceServiceImpl nonConformanceService;

    private NonConformance nonConformance;

    @BeforeEach
    void setUp() {
        Product product = new Product();
        product.setId(9L);
        product.setName("Chocolate Brownie");

        nonConformance = new NonConformance();
        nonConformance.setId(1L);
        nonConformance.setProduct(product);
        nonConformance.setSeverity(NcSeverity.MAJOR);
        nonConformance.setStatus(NcStatus.IN_PROGRESS);

        lenient().when(nonConformanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("raise creates an OPEN non-conformance and notifies quality managers")
    void raiseCreatesOpenNc() {
        Product product = new Product();
        product.setId(9L);
        product.setName("Chocolate Brownie");
        when(productRepository.findById(9L)).thenReturn(Optional.of(product));

        NonConformance created = nonConformanceService.raise(9L, null, "Undeclared allergen",
                "Milk not declared", NcSeverity.CRITICAL, "quality");

        assertThat(created.getStatus()).isEqualTo(NcStatus.OPEN);
        assertThat(created.getSeverity()).isEqualTo(NcSeverity.CRITICAL);
    }

    @Test
    @DisplayName("close fails when a corrective action is still open")
    void closeFailsWithOpenCapa() {
        when(nonConformanceRepository.findById(1L)).thenReturn(Optional.of(nonConformance));
        when(correctiveActionRepository.countByNonConformanceIdAndStatus(1L, CapaStatus.OPEN)).thenReturn(1L);

        assertThatThrownBy(() -> nonConformanceService.close(1L))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("still open");
    }

    @Test
    @DisplayName("close succeeds once all corrective actions are done")
    void closeSucceedsWithNoOpenCapa() {
        when(nonConformanceRepository.findById(1L)).thenReturn(Optional.of(nonConformance));
        when(correctiveActionRepository.countByNonConformanceIdAndStatus(1L, CapaStatus.OPEN)).thenReturn(0L);

        NonConformance closed = nonConformanceService.close(1L);

        assertThat(closed.getStatus()).isEqualTo(NcStatus.CLOSED);
        assertThat(closed.getClosedAt()).isNotNull();
    }

    @Test
    @DisplayName("addCorrectiveAction fails once the non-conformance is closed")
    void cannotAddActionToClosedNc() {
        nonConformance.setStatus(NcStatus.CLOSED);
        when(nonConformanceRepository.findById(1L)).thenReturn(Optional.of(nonConformance));

        assertThatThrownBy(() -> nonConformanceService.addCorrectiveAction(1L, "Retrain staff", "quality", null))
                .isInstanceOf(FormCraftException.class);
    }

    @Test
    @DisplayName("closeCorrectiveAction rejects an action belonging to a different non-conformance")
    void closeActionRejectsMismatchedNc() {
        CorrectiveAction action = new CorrectiveAction();
        action.setId(5L);
        NonConformance otherNc = new NonConformance();
        otherNc.setId(2L);
        action.setNonConformance(otherNc);

        when(correctiveActionRepository.findById(5L)).thenReturn(Optional.of(action));

        assertThatThrownBy(() -> nonConformanceService.closeCorrectiveAction(1L, 5L))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("does not belong");
    }
}
