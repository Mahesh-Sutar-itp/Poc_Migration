package fr.formcraft.repo.audit;

import fr.formcraft.common.constants.RepoConsts;
import fr.formcraft.model.entity.AuditLog;
import fr.formcraft.repo.jpa.AuditLogRepository;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for writing audit log entries.
 * Uses async persistence to avoid slowing down main operations.
 */
@Service
public class AuditService {

    private static final Log logger = LogFactory.getLog(AuditService.class);

    private static final String PRODUCT_TYPE = "Product";

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCreate(Long entityId, String details) {
        writeLog(entityId, PRODUCT_TYPE, RepoConsts.AUDIT_CREATE, details);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logUpdate(Long entityId, String details) {
        writeLog(entityId, PRODUCT_TYPE, RepoConsts.AUDIT_UPDATE, details);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFormulation(Long productId, String chainId, String status) {
        writeLog(productId, PRODUCT_TYPE, RepoConsts.AUDIT_FORMULATE,
                "chainId=" + chainId + " status=" + status);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logWorkflowTransition(Long productId, String fromState, String toState) {
        writeLog(productId, PRODUCT_TYPE, RepoConsts.AUDIT_TRANSITION,
                fromState + " -> " + toState);
    }

    /** Generic audit entry for any module's entity (e.g. "ChangeRequest", "NonConformance", "Project"). */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(Long entityId, String entityType, String action, String details) {
        writeLog(entityId, entityType, action, details);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getProductHistory(Long productId) {
        return auditLogRepository.findByEntityIdAndEntityTypeOrderByPerformedAtDesc(productId, PRODUCT_TYPE);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getHistory(Long entityId, String entityType) {
        return auditLogRepository.findByEntityIdAndEntityTypeOrderByPerformedAtDesc(entityId, entityType);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentActivity(int limit) {
        return auditLogRepository.findAllByOrderByPerformedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, limit));
    }

    private void writeLog(Long entityId, String entityType, String action, String details) {
        try {
            AuditLog log = new AuditLog();
            log.setEntityId(entityId);
            log.setEntityType(entityType);
            log.setAction(action);
            log.setPerformedBy(getCurrentUser());
            log.setDetails(details);
            auditLogRepository.save(log);
        } catch (Exception e) {
            logger.error("Failed to write audit log for entityId=" + entityId + ": " + e.getMessage(), e);
        }
    }

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null) ? auth.getName() : "system";
    }
}
