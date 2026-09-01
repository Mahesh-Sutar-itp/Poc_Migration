package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.FormulationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormulationResultRepository extends JpaRepository<FormulationResult, Long> {

    List<FormulationResult> findByProductIdOrderByFormulatedAtDesc(Long productId);

    Optional<FormulationResult> findFirstByProductIdAndChainIdOrderByFormulatedAtDesc(
            Long productId, String chainId);
}
