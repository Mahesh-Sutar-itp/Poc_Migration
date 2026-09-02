package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.ChangeRequest;
import fr.formcraft.model.enums.ChangeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, Long> {

    List<ChangeRequest> findByProductId(Long productId);

    List<ChangeRequest> findByStatus(ChangeRequestStatus status);

    long countByStatus(ChangeRequestStatus status);
}
