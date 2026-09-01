package fr.formcraft.repo.quality;

import fr.formcraft.model.entity.QualityCheck;

import java.util.List;

/**
 * Quality management service — runs checks on products and manages results.
 */
public interface QualityService {

    /**
     * Run all standard quality checks on a product.
     *
     * @param productId the product to check
     * @return list of check results
     */
    List<QualityCheck> runAllChecks(Long productId);

    /**
     * Run a specific quality check by type.
     *
     * @param productId the product to check
     * @param checkType the type of check to run
     * @return the check result
     */
    QualityCheck runCheck(Long productId, String checkType);

    List<QualityCheck> getChecksForProduct(Long productId);

    boolean allChecksPassed(Long productId);
}
