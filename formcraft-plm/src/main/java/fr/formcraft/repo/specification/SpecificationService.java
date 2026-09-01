package fr.formcraft.repo.specification;

import fr.formcraft.model.entity.Specification;

import java.util.List;

public interface SpecificationService {

    List<Specification> getForProduct(Long productId);

    Specification getById(Long id);

    Specification createSpecification(Long productId, Specification spec, String createdBy);

    Specification updateSpecification(Long id, Specification updated);

    void deleteSpecification(Long id);
}
