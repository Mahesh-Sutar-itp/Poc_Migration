package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.NutrientValue;
import fr.formcraft.model.enums.NutrientType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NutrientValueRepository extends JpaRepository<NutrientValue, Long> {

    List<NutrientValue> findByProductId(Long productId);

    Optional<NutrientValue> findByProductIdAndNutrientType(Long productId, NutrientType nutrientType);

    void deleteByProductId(Long productId);
}
