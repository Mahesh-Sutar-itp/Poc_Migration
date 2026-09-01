package fr.formcraft.repo.nonconformance.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.CorrectiveAction;
import fr.formcraft.model.entity.NonConformance;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.QualityCheck;
import fr.formcraft.model.enums.CapaStatus;
import fr.formcraft.model.enums.NcSeverity;
import fr.formcraft.model.enums.NcStatus;
import fr.formcraft.model.enums.NotificationCategory;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.jpa.CorrectiveActionRepository;
import fr.formcraft.repo.jpa.NonConformanceRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.QualityCheckRepository;
import fr.formcraft.repo.nonconformance.NonConformanceService;
import fr.formcraft.repo.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service("nonConformanceService")
public class NonConformanceServiceImpl implements NonConformanceService {

    private final NonConformanceRepository nonConformanceRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final ProductRepository productRepository;
    private final QualityCheckRepository qualityCheckRepository;
    private final NotificationService notificationService;

    @Autowired
    public NonConformanceServiceImpl(NonConformanceRepository nonConformanceRepository,
                                      CorrectiveActionRepository correctiveActionRepository,
                                      ProductRepository productRepository,
                                      QualityCheckRepository qualityCheckRepository,
                                      NotificationService notificationService) {
        this.nonConformanceRepository = nonConformanceRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.productRepository = productRepository;
        this.qualityCheckRepository = qualityCheckRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NonConformance> getAll() {
        return nonConformanceRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NonConformance> getForProduct(Long productId) {
        return nonConformanceRepository.findByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public NonConformance getById(Long id) {
        return nonConformanceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("NonConformance", id));
    }

    @Override
    @Transactional
    public NonConformance raise(Long productId, Long qualityCheckId, String title, String description,
                                 NcSeverity severity, String raisedBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));

        NonConformance nc = new NonConformance();
        nc.setProduct(product);
        nc.setTitle(title);
        nc.setDescription(description);
        nc.setSeverity(severity);
        nc.setRaisedBy(raisedBy);
        nc.setStatus(NcStatus.OPEN);

        if (qualityCheckId != null) {
            QualityCheck check = qualityCheckRepository.findById(qualityCheckId)
                    .orElseThrow(() -> new EntityNotFoundException("QualityCheck", qualityCheckId));
            nc.setQualityCheck(check);
        }

        NonConformance saved = nonConformanceRepository.save(nc);

        notificationService.notifyRole(UserRole.QUALITY_MANAGER, "Non-conformance raised: " + severity,
                "\"" + title + "\" raised against " + product.getName(),
                "/non-conformances/" + saved.getId(), NotificationCategory.QUALITY);

        return saved;
    }

    @Override
    @Transactional
    public NonConformance transitionStatus(Long id, NcStatus target) {
        NonConformance nc = getById(id);

        if (!nc.getStatus().canTransitionTo(target)) {
            throw new FormCraftException("Invalid non-conformance transition: " + nc.getStatus() + " -> " + target);
        }
        if (target == NcStatus.CLOSED) {
            return doClose(nc);
        }

        nc.setStatus(target);
        return nonConformanceRepository.save(nc);
    }

    @Override
    @Transactional
    public NonConformance close(Long id) {
        NonConformance nc = getById(id);
        if (!nc.getStatus().canTransitionTo(NcStatus.CLOSED)) {
            throw new FormCraftException("Non-conformance must be IN_PROGRESS before it can be closed");
        }
        return doClose(nc);
    }

    private NonConformance doClose(NonConformance nc) {
        long openActions = correctiveActionRepository.countByNonConformanceIdAndStatus(nc.getId(), CapaStatus.OPEN);
        if (openActions > 0) {
            throw new FormCraftException("Cannot close non-conformance: " + openActions
                    + " corrective action(s) are still open");
        }
        nc.setStatus(NcStatus.CLOSED);
        nc.setClosedAt(LocalDateTime.now());
        return nonConformanceRepository.save(nc);
    }

    @Override
    @Transactional
    public CorrectiveAction addCorrectiveAction(Long ncId, String description, String owner, LocalDate dueDate) {
        NonConformance nc = getById(ncId);
        if (nc.getStatus() == NcStatus.CLOSED) {
            throw new FormCraftException("Cannot add a corrective action to a closed non-conformance");
        }

        CorrectiveAction action = new CorrectiveAction();
        action.setNonConformance(nc);
        action.setDescription(description);
        action.setOwner(owner);
        action.setDueDate(dueDate);
        action.setStatus(CapaStatus.OPEN);
        return correctiveActionRepository.save(action);
    }

    @Override
    @Transactional
    public CorrectiveAction closeCorrectiveAction(Long ncId, Long actionId) {
        CorrectiveAction action = correctiveActionRepository.findById(actionId)
                .orElseThrow(() -> new EntityNotFoundException("CorrectiveAction", actionId));

        if (!action.getNonConformance().getId().equals(ncId)) {
            throw new FormCraftException("Corrective action does not belong to non-conformance " + ncId);
        }

        action.setStatus(CapaStatus.DONE);
        action.setClosedAt(LocalDateTime.now());
        return correctiveActionRepository.save(action);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CorrectiveAction> getCorrectiveActions(Long ncId) {
        return correctiveActionRepository.findByNonConformanceId(ncId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(NcStatus status) {
        return nonConformanceRepository.countByStatus(status);
    }
}
