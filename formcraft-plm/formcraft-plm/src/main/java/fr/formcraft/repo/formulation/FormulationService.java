package fr.formcraft.repo.formulation;

import fr.formcraft.model.entity.Product;

/**
 * Service interface for triggering the formulation chain on a product.
 * Mirrors beCPG's FormulationService interface pattern exactly.
 */
public interface FormulationService {

    String DEFAULT_CHAIN_ID = "default";
    String FAST_CHAIN_ID    = "fastFormulationChain";

    /**
     * Run the full formulation chain on a product identified by ID.
     *
     * @param productId the product to formulate
     * @param chainId   the chain to run (default or fastFormulationChain)
     * @return the formulated product with computed values
     */
    Product formulate(Long productId, String chainId);

    /**
     * Run formulation using the default chain.
     *
     * @param productId the product to formulate
     * @return the formulated product with computed values
     */
    Product formulate(Long productId);

    /**
     * Check whether formulation should be triggered for a product.
     * Returns false for raw materials (no composition to compute).
     *
     * @param productId the product to check
     * @return true if formulation is applicable
     */
    boolean shouldFormulate(Long productId);
}
