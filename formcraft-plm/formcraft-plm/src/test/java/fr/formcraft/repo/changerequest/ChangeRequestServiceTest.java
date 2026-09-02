package fr.formcraft.repo.changerequest;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.ChangeRequest;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ChangeRequestStatus;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.changerequest.impl.ChangeRequestServiceImpl;
import fr.formcraft.repo.jpa.ChangeRequestRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChangeRequestService unit tests")
class ChangeRequestServiceTest {

    @Mock private ChangeRequestRepository changeRequestRepository;
    @Mock private ProductRepository productRepository;
    @Mock private AuditService auditService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ChangeRequestServiceImpl changeRequestService;

    private ChangeRequest changeRequest;

    @BeforeEach
    void setUp() {
        Product product = new Product();
        product.setId(9L);
        product.setCode("FP-001");

        changeRequest = new ChangeRequest();
        changeRequest.setId(1L);
        changeRequest.setProduct(product);
        changeRequest.setTitle("Reduce sugar content");
        changeRequest.setStatus(ChangeRequestStatus.DRAFT);
        changeRequest.setRequestedBy("plmmanager");

        lenient().when(changeRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("submit moves a DRAFT request through SUBMITTED to UNDER_REVIEW")
    void submitMovesToUnderReview() {
        when(changeRequestRepository.findById(1L)).thenReturn(Optional.of(changeRequest));

        ChangeRequest result = changeRequestService.submit(1L);

        assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.UNDER_REVIEW);
    }

    @Test
    @DisplayName("decide approves an UNDER_REVIEW request and records the decision")
    void decideApprovesRequest() {
        changeRequest.setStatus(ChangeRequestStatus.UNDER_REVIEW);
        when(changeRequestRepository.findById(1L)).thenReturn(Optional.of(changeRequest));

        ChangeRequest result = changeRequestService.decide(1L, true, "admin", "Looks good");

        assertThat(result.getStatus()).isEqualTo(ChangeRequestStatus.APPROVED);
        assertThat(result.getDecidedBy()).isEqualTo("admin");
        assertThat(result.getDecisionComment()).isEqualTo("Looks good");
    }

    @Test
    @DisplayName("decide rejecting a DRAFT request throws because DRAFT cannot go straight to REJECTED")
    void decideOnDraftThrows() {
        when(changeRequestRepository.findById(1L)).thenReturn(Optional.of(changeRequest));

        assertThatThrownBy(() -> changeRequestService.decide(1L, false, "admin", "Not ready"))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("Invalid change request transition");
    }

    @Test
    @DisplayName("implement requires the request to already be APPROVED")
    void implementRequiresApproved() {
        changeRequest.setStatus(ChangeRequestStatus.DRAFT);
        when(changeRequestRepository.findById(1L)).thenReturn(Optional.of(changeRequest));

        assertThatThrownBy(() -> changeRequestService.implement(1L))
                .isInstanceOf(FormCraftException.class);
    }
}
