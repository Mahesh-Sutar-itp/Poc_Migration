package fr.formcraft.repo.formulation.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormulationException;
import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.FormulationResult;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.formulation.FormulationContext;
import fr.formcraft.repo.formulation.FormulationHandler;
import fr.formcraft.repo.formulation.FormulationService;
import fr.formcraft.repo.jpa.CompositionLineRepository;
import fr.formcraft.repo.jpa.FormulationResultRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Formulation service implementation — orchestrates the chain of handlers.
 * Mirrors beCPG's FormulationServiceImpl.
 */
@Service("formulationService")
public class FormulationServiceImpl implements FormulationService {

    private static final Log logger = LogFactory.getLog(FormulationServiceImpl.class);

    private final ProductRepository productRepository;
    private final CompositionLineRepository compositionLineRepository;
    private final FormulationResultRepository formulationResultRepository;
    private final AuditService auditService;
    private final List<FormulationHandler> defaultChainHandlers;

    @Autowired
    public FormulationServiceImpl(ProductRepository productRepository,
                                   CompositionLineRepository compositionLineRepository,
                                   FormulationResultRepository formulationResultRepository,
                                   AuditService auditService,
                                   NutritionalFormulationHandler nutritionalHandler,
                                   CostFormulationHandler costHandler,
                                   ComplianceFormulationHandler complianceHandler,
                                   ScoreFormulationHandler scoreHandler) {
        this.productRepository = productRepository;
        this.compositionLineRepository = compositionLineRepository;
        this.formulationResultRepository = formulationResultRepository;
        this.auditService = auditService;
        this.defaultChainHandlers = buildDefaultChain(nutritionalHandler, costHandler,
                                                       complianceHandler, scoreHandler);
    }

    @Override
    @Transactional
    public Product formulate(Long productId, String chainId) {
        if (logger.isDebugEnabled()) {
            logger.debug("Starting formulation for product=" + productId + " chain=" + chainId);
        }

        Product product = productRepository.findByIdWithComposition(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));

        if (!shouldFormulate(productId)) {
            logger.info("Skipping formulation for raw material product=" + productId);
            return product;
        }

        List<CompositionLine> lines = compositionLineRepository
                .findByProductIdWithIngredient(productId);

        FormulationContext context = new FormulationContext(product, chainId, lines);
        runChain(context, chainId);

        FormulationResult result = buildFormulationResult(product, context);
        formulationResultRepository.save(result);

        auditService.logFormulation(productId, chainId, context.getStatus());

        if (logger.isDebugEnabled()) {
            logger.debug("Formulation completed for product=" + productId
                    + " status=" + context.getStatus());
        }

        return product;
    }

    @Override
    @Transactional
    public Product formulate(Long productId) {
        return formulate(productId, DEFAULT_CHAIN_ID);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean shouldFormulate(Long productId) {
        return productRepository.findById(productId)
                .map(p -> p.getProductType() != ProductType.RAW_MATERIAL)
                .orElse(false);
    }

    private void runChain(FormulationContext context, String chainId) {
        List<FormulationHandler> handlers = resolveChain(chainId);

        for (FormulationHandler handler : handlers) {
            if (context.isAborted()) {
                logger.warn("Formulation chain aborted at handler=" + handler.getHandlerName());
                break;
            }
            try {
                handler.handle(context);
            } catch (FormulationException e) {
                context.addError("Handler " + handler.getHandlerName() + " failed: " + e.getMessage());
                context.setAborted(true);
            }
        }
    }

    private List<FormulationHandler> resolveChain(String chainId) {
        // Fast chain skips compliance and scoring — mirrors beCPG's fastFormulationChain
        if (FAST_CHAIN_ID.equals(chainId)) {
            return defaultChainHandlers.subList(0, 2);
        }
        return defaultChainHandlers;
    }

    private FormulationResult buildFormulationResult(Product product, FormulationContext context) {
        FormulationResult result = new FormulationResult();
        result.setProduct(product);
        result.setChainId(context.getChainId());
        result.setStatus(context.getStatus());
        result.setComputedValues(context.getComputedNutrients());
        result.setNutriScore(context.getNutriScore());
        result.setEcoScore(context.getEcoScore());
        result.setTotalCost(BigDecimal.valueOf(context.getTotalCost()));
        result.setErrors(context.hasErrors() ? context.getErrorsSummary() : null);
        result.setWarnings(!context.getWarnings().isEmpty() ? context.getWarningsSummary() : null);
        return result;
    }

    private List<FormulationHandler> buildDefaultChain(FormulationHandler... handlers) {
        // Wire the chain sequentially
        for (int i = 0; i < handlers.length - 1; i++) {
            handlers[i].setNext(handlers[i + 1]);
        }
        return List.of(handlers);
    }
}
