package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityIdAndEntityTypeOrderByPerformedAtDesc(Long entityId, String entityType);

    List<AuditLog> findByPerformedByOrderByPerformedAtDesc(String performedBy);

    List<AuditLog> findAllByOrderByPerformedAtDesc(Pageable pageable);
}
