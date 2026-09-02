package fr.formcraft.repo.nonconformance;

import fr.formcraft.model.entity.CorrectiveAction;
import fr.formcraft.model.entity.NonConformance;
import fr.formcraft.model.enums.NcSeverity;
import fr.formcraft.model.enums.NcStatus;

import java.time.LocalDate;
import java.util.List;

public interface NonConformanceService {

    List<NonConformance> getAll();

    List<NonConformance> getForProduct(Long productId);

    NonConformance getById(Long id);

    NonConformance raise(Long productId, Long qualityCheckId, String title, String description,
                          NcSeverity severity, String raisedBy);

    NonConformance transitionStatus(Long id, NcStatus target);

    NonConformance close(Long id);

    CorrectiveAction addCorrectiveAction(Long ncId, String description, String owner, LocalDate dueDate);

    CorrectiveAction closeCorrectiveAction(Long ncId, Long actionId);

    List<CorrectiveAction> getCorrectiveActions(Long ncId);

    long countByStatus(NcStatus status);
}
