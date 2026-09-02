package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.CorrectiveAction;
import fr.formcraft.model.enums.CapaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorrectiveActionRepository extends JpaRepository<CorrectiveAction, Long> {

    List<CorrectiveAction> findByNonConformanceId(Long nonConformanceId);

    long countByNonConformanceIdAndStatus(Long nonConformanceId, CapaStatus status);

    long countByStatus(CapaStatus status);
}
