package fr.formcraft.repo.quality.impl;

import fr.formcraft.common.constants.RepoConsts;
import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.QualityCheck;
import fr.formcraft.model.enums.QualityCheckStatus;
import fr.formcraft.repo.jpa.CompositionLineRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.WorkflowTaskRepository;
import fr.formcraft.repo.quality.QualityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.List;

@Service("qualityService")
public class QualityServiceImpl implements QualityService {

    private final ProductRepository productRepository;
    private final CompositionLineRepository compositionLineRepository;
    private final EntityManager entityManager;

    @Autowired
    public QualityServiceImpl(ProductRepository productRepository,
                               CompositionLineRepository compositionLineRepository,
                               EntityManager entityManager) {
        this.productRepository = productRepository;
        this.compositionLineRepository = compositionLineRepository;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public List<QualityCheck> runAllChecks(Long productId) {
        List<QualityCheck> results = new ArrayList<>();
        results.add(runCheck(productId, RepoConsts.CHECK_COMPOSITION));
        results.add(runCheck(productId, RepoConsts.CHECK_ALLERGEN));
        results.add(runCheck(productId, RepoConsts.CHECK_COST));
        return results;
    }

    @Override
    @Transactional
    public QualityCheck runCheck(Long productId, String checkType) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));

        QualityCheck check = new QualityCheck();
        check.setProduct(product);
        check.setCheckType(checkType);

        switch (checkType) {
            case RepoConsts.CHECK_COMPOSITION -> performCompositionCheck(check, product, productId);
            case RepoConsts.CHECK_ALLERGEN    -> performAllergenCheck(check, product, productId);
            case RepoConsts.CHECK_COST        -> performCostCheck(check, product);
            default -> {
                check.setStatus(QualityCheckStatus.FAILED);
                check.setResult("Unknown check type: " + checkType);
            }
        }

        entityManager.persist(check);
        return check;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QualityCheck> getChecksForProduct(Long productId) {
        return productRepository.findById(productId)
                .map(Product::getQualityChecks)
                .orElse(List.of());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean allChecksPassed(Long productId) {
        List<QualityCheck> checks = getChecksForProduct(productId);
        if (checks.isEmpty()) {
            return false;
        }
        return checks.stream().allMatch(c -> c.getStatus() == QualityCheckStatus.PASSED);
    }

    private void performCompositionCheck(QualityCheck check, Product product, Long productId) {
        List<CompositionLine> lines = compositionLineRepository.findByProductIdWithIngredient(productId);

        if (lines.isEmpty()) {
            check.setStatus(QualityCheckStatus.FAILED);
            check.setResult("Product has no composition lines");
            return;
        }

        double totalPct = lines.stream().mapToDouble(CompositionLine::getQuantityFraction).sum() * 100.0;
        double deviation = Math.abs(totalPct - 100.0);

        if (deviation > 1.0) {
            check.setStatus(QualityCheckStatus.FAILED);
            check.setResult(String.format("Composition total is %.2f%% — must be 100%%", totalPct));
        } else {
            check.setStatus(QualityCheckStatus.PASSED);
            check.setResult(String.format("Composition total: %.4f%% ✓", totalPct));
        }
    }

    private void performAllergenCheck(QualityCheck check, Product product, Long productId) {
        List<CompositionLine> lines = compositionLineRepository.findByProductIdWithIngredient(productId);
        String declared = product.getAllergenFlags();
        List<String> issues = new ArrayList<>();

        List<String> knownAllergens = List.of(
                RepoConsts.ALLERGEN_GLUTEN, RepoConsts.ALLERGEN_EGGS, RepoConsts.ALLERGEN_MILK,
                RepoConsts.ALLERGEN_NUTS, RepoConsts.ALLERGEN_SOY);

        for (String allergen : knownAllergens) {
            boolean inIngredients = lines.stream()
                    .anyMatch(l -> l.getIngredient().hasAllergen(allergen));
            boolean isDeclared = declared != null && declared.contains(allergen);

            if (inIngredients && !isDeclared) {
                issues.add("UNDECLARED: " + allergen);
            }
        }

        if (issues.isEmpty()) {
            check.setStatus(QualityCheckStatus.PASSED);
            check.setResult("All allergens correctly declared ✓");
        } else {
            check.setStatus(QualityCheckStatus.FAILED);
            check.setResult("Allergen issues: " + String.join(", ", issues));
        }
    }

    private void performCostCheck(QualityCheck check, Product product) {
        if (product.getCostPerKg() != null && product.getCostPerKg().doubleValue() > 0) {
            check.setStatus(QualityCheckStatus.PASSED);
            check.setResult("Cost per kg: " + product.getCostPerKg() + " ✓");
        } else {
            check.setStatus(QualityCheckStatus.FAILED);
            check.setResult("Product cost per kg is not set or zero");
        }
    }
}
