package fr.formcraft.repo.changerequest;

import fr.formcraft.model.entity.ChangeRequest;

import java.util.List;

public interface ChangeRequestService {

    List<ChangeRequest> getAll();

    List<ChangeRequest> getForProduct(Long productId);

    ChangeRequest getById(Long id);

    ChangeRequest create(Long productId, String title, String description, String reason,
                          String impact, String requestedBy);

    ChangeRequest submit(Long id);

    ChangeRequest startReview(Long id);

    ChangeRequest decide(Long id, boolean approve, String decidedBy, String comment);

    ChangeRequest implement(Long id);
}
