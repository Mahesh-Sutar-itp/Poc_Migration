package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.NonConformance;
import fr.formcraft.model.enums.NcStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NonConformanceRepository extends JpaRepository<NonConformance, Long> {

    List<NonConformance> findByProductId(Long productId);

    List<NonConformance> findByStatus(NcStatus status);

    long countByStatus(NcStatus status);
}
