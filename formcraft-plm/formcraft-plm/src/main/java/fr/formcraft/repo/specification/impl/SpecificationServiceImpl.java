package fr.formcraft.repo.specification.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.Specification;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.SpecificationRepository;
import fr.formcraft.repo.specification.SpecificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("specificationService")
public class SpecificationServiceImpl implements SpecificationService {

    private final SpecificationRepository specificationRepository;
    private final ProductRepository productRepository;

    @Autowired
    public SpecificationServiceImpl(SpecificationRepository specificationRepository,
                                     ProductRepository productRepository) {
        this.specificationRepository = specificationRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Specification> getForProduct(Long productId) {
        return specificationRepository.findByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public Specification getById(Long id) {
        return specificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Specification", id));
    }

    @Override
    @Transactional
    public Specification createSpecification(Long productId, Specification spec, String createdBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));

        spec.setProduct(product);
        spec.setCreatedBy(createdBy);
        return specificationRepository.save(spec);
    }

    @Override
    @Transactional
    public Specification updateSpecification(Long id, Specification updated) {
        Specification existing = getById(id);
        existing.setParameter(updated.getParameter());
        existing.setSpecType(updated.getSpecType());
        existing.setMinValue(updated.getMinValue());
        existing.setMaxValue(updated.getMaxValue());
        existing.setTargetValue(updated.getTargetValue());
        existing.setUnit(updated.getUnit());
        return specificationRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteSpecification(Long id) {
        Specification spec = getById(id);
        specificationRepository.delete(spec);
    }
}
