package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.CustomAttributeDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomAttributeDefinitionRepository extends JpaRepository<CustomAttributeDefinition, Long> {

    boolean existsByAttributeKey(String attributeKey);
}
