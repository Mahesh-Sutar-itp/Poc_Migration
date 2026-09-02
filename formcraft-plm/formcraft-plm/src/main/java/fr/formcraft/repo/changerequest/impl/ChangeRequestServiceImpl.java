package fr.formcraft.repo.changerequest.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.ChangeRequest;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ChangeRequestStatus;
import fr.formcraft.model.enums.NotificationCategory;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.changerequest.ChangeRequestService;
import fr.formcraft.repo.jpa.ChangeRequestRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service("changeRequestService")
public class ChangeRequestServiceImpl implements ChangeRequestService {

    private static final String ENTITY_TYPE = "ChangeRequest";

    private final ChangeRequestRepository changeRequestRepository;
    private final ProductRepository productRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Autowired
    public ChangeRequestServiceImpl(ChangeRequestRepository changeRequestRepository,
                                     ProductRepository productRepository,
                                     AuditService auditService,
                                     NotificationService notificationService) {
        this.changeRequestRepository = changeRequestRepository;
        this.productRepository = productRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequest> getAll() {
        return changeRequestRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequest> getForProduct(Long productId) {
        return changeRequestRepository.findByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChangeRequest getById(Long id) {
        return changeRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ChangeRequest", id));
    }

    @Override
    @Transactional
    public ChangeRequest create(Long productId, String title, String description, String reason,
                                 String impact, String requestedBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));

        ChangeRequest cr = new ChangeRequest();
        cr.setProduct(product);
        cr.setTitle(title);
        cr.setDescription(description);
        cr.setReason(reason);
        cr.setImpact(impact);
        cr.setRequestedBy(requestedBy);
        cr.setStatus(ChangeRequestStatus.DRAFT);

        ChangeRequest saved = changeRequestRepository.save(cr);
        auditService.logAction(saved.getId(), ENTITY_TYPE, "CREATE", "title=" + title + " product=" + product.getCode());
        return saved;
    }

    @Override
    @Transactional
    public ChangeRequest submit(Long id) {
        ChangeRequest cr = transition(id, ChangeRequestStatus.SUBMITTED);
        cr = transition(cr.getId(), ChangeRequestStatus.UNDER_REVIEW);

        notificationService.notifyRole(UserRole.PLM_MANAGER, "Change request awaiting review",
                "\"" + cr.getTitle() + "\" is ready for your review.",
                "/change-requests/" + cr.getId(), NotificationCategory.CHANGE_REQUEST);

        return cr;
    }

    @Override
    @Transactional
    public ChangeRequest startReview(Long id) {
        return transition(id, ChangeRequestStatus.UNDER_REVIEW);
    }

    @Override
    @Transactional
    public ChangeRequest decide(Long id, boolean approve, String decidedBy, String comment) {
        ChangeRequest cr = transition(id, approve ? ChangeRequestStatus.APPROVED : ChangeRequestStatus.REJECTED);
        cr.setDecidedBy(decidedBy);
        cr.setDecidedAt(LocalDateTime.now());
        cr.setDecisionComment(comment);
        ChangeRequest saved = changeRequestRepository.save(cr);

        auditService.logAction(saved.getId(), ENTITY_TYPE, approve ? "APPROVE" : "REJECT",
                "by=" + decidedBy + " comment=" + comment);

        if (saved.getRequestedBy() != null) {
            notificationService.notifyUser(saved.getRequestedBy(),
                    "Change request " + (approve ? "approved" : "rejected"),
                    "\"" + saved.getTitle() + "\" was " + (approve ? "approved" : "rejected") + ".",
                    "/change-requests/" + saved.getId(), NotificationCategory.CHANGE_REQUEST);
        }

        return saved;
    }

    @Override
    @Transactional
    public ChangeRequest implement(Long id) {
        ChangeRequest cr = transition(id, ChangeRequestStatus.IMPLEMENTED);
        auditService.logAction(cr.getId(), ENTITY_TYPE, "IMPLEMENT", "product=" + cr.getProduct().getCode());
        return cr;
    }

    private ChangeRequest transition(Long id, ChangeRequestStatus target) {
        ChangeRequest cr = getById(id);
        if (!cr.getStatus().canTransitionTo(target)) {
            throw new FormCraftException("Invalid change request transition: " + cr.getStatus() + " -> " + target);
        }
        cr.setStatus(target);
        return changeRequestRepository.save(cr);
    }
}
