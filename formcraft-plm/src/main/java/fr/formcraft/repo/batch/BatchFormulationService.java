package fr.formcraft.repo.batch;

import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.repo.formulation.FormulationService;
import fr.formcraft.repo.jpa.ProductRepository;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Service to handle batch formulations across multiple products asynchronously.
 */
@Service
public class BatchFormulationService {

    private static final Log logger = LogFactory.getLog(BatchFormulationService.class);

    private final ProductRepository productRepository;
    private final FormulationService formulationService;

    @Autowired
    public BatchFormulationService(ProductRepository productRepository,
                                   FormulationService formulationService) {
        this.productRepository = productRepository;
        this.formulationService = formulationService;
    }

    /**
     * Re-formulates all FINISHED_PRODUCT types asynchronously.
     *
     * @return CompletableFuture with the number of products processed
     */
    @Async
    @Transactional(readOnly = true)
    public CompletableFuture<Integer> reformulateAllFinishedProducts() {
        logger.info("Starting batch formulation for all finished products...");
        
        List<Product> products = productRepository.findByProductType(ProductType.FINISHED_PRODUCT);
        int count = 0;
        
        for (Product p : products) {
            try {
                // In a real app we'd want this in a separate transaction per item
                formulationService.formulate(p.getId());
                count++;
            } catch (Exception e) {
                logger.error("Failed to formulate product " + p.getId(), e);
            }
        }
        
        logger.info("Batch formulation complete. Processed " + count + " products.");
        return CompletableFuture.completedFuture(count);
    }
}
