package fr.formcraft.repo.product.impl;

import fr.formcraft.common.constants.RepoConsts;
import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.jpa.CompositionLineRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.product.ProductService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * ProductService implementation.
 * Handles product lifecycle: CRUD, composition management, state changes.
 */
@Service("productService")
public class ProductServiceImpl implements ProductService {

    private static final Log logger = LogFactory.getLog(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final CompositionLineRepository compositionLineRepository;
    private final AuditService auditService;

    @Autowired
    public ProductServiceImpl(ProductRepository productRepository,
                               CompositionLineRepository compositionLineRepository,
                               AuditService auditService) {
        this.productRepository = productRepository;
        this.compositionLineRepository = compositionLineRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public Product createProduct(Product product) {
        if (productRepository.existsByCode(product.getCode())) {
            throw new FormCraftException("Product with code '" + product.getCode() + "' already exists");
        }

        product.setState(ProductState.DRAFT);
        Product saved = productRepository.save(product);

        auditService.logCreate(saved.getId(), "code=" + saved.getCode() + " type=" + saved.getProductType());

        if (logger.isDebugEnabled()) {
            logger.debug("Created product id=" + saved.getId() + " code=" + saved.getCode());
        }

        return saved;
    }

    @Override
    @Transactional
    public Product updateProduct(Long productId, Product updated) {
        Product existing = getById(productId);

        if (existing.getState() == ProductState.VALIDATED) {
            throw new FormCraftException("Cannot update a validated product — create a change order first");
        }

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setUnit(updated.getUnit());
        existing.setCostPerKg(updated.getCostPerKg());
        existing.setFormulaExpression(updated.getFormulaExpression());
        existing.setAllergenFlags(updated.getAllergenFlags());

        Product saved = productRepository.save(existing);
        auditService.logUpdate(productId, "name=" + updated.getName());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Product> findById(Long productId) {
        return productRepository.findById(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public Product getById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Product> findByCode(String code) {
        return productRepository.findByCode(code);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Product> findAll(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> findByType(ProductType type) {
        return productRepository.findByProductType(type);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> findByState(ProductState state) {
        return productRepository.findByState(state);
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId) {
        Product product = getById(productId);

        if (product.getState() != ProductState.DRAFT && product.getState() != ProductState.ARCHIVED) {
            throw new FormCraftException("Cannot delete product in state " + product.getState()
                    + " — only DRAFT or ARCHIVED products can be deleted");
        }

        if (compositionLineRepository.existsByIngredientId(productId)) {
            throw new FormCraftException("Cannot delete product '" + product.getCode()
                    + "' — it is used as an ingredient in another product's composition");
        }

        productRepository.delete(product);
        auditService.logAction(productId, "Product", RepoConsts.AUDIT_DELETE, "DELETED code=" + product.getCode());
    }

    @Override
    @Transactional
    public Product addCompositionLine(Long productId, Long ingredientId, double quantity, String unit) {
        Product product    = getById(productId);
        Product ingredient = productRepository.findById(ingredientId)
                .orElseThrow(() -> new EntityNotFoundException("Ingredient", ingredientId));

        if (ingredient.getProductType() != ProductType.RAW_MATERIAL
                && ingredient.getProductType() != ProductType.SEMI_FINISHED) {
            throw new FormCraftException("Ingredient must be a RAW_MATERIAL or SEMI_FINISHED product");
        }

        CompositionLine line = new CompositionLine();
        line.setProduct(product);
        line.setIngredient(ingredient);
        line.setQuantity(BigDecimal.valueOf(quantity));
        line.setUnit(unit);
        line.setPosition(product.getCompositionLines().size() + 1);
        compositionLineRepository.save(line);

        return getById(productId);
    }

    @Override
    @Transactional
    public Product removeCompositionLine(Long productId, Long compositionLineId) {
        CompositionLine line = compositionLineRepository.findById(compositionLineId)
                .orElseThrow(() -> new EntityNotFoundException("CompositionLine", compositionLineId));

        if (!line.getProduct().getId().equals(productId)) {
            throw new FormCraftException("Composition line does not belong to product " + productId);
        }

        compositionLineRepository.delete(line);
        return getById(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompositionLine> getComposition(Long productId) {
        return compositionLineRepository.findByProductIdWithIngredient(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByState(ProductState state) {
        return productRepository.countByState(state);
    }
}
