package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecificationRepository extends JpaRepository<Specification, Long> {

    List<Specification> findByProductId(Long productId);
}
