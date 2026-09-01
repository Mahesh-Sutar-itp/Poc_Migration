package fr.formcraft.repo.formulation.impl;

import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.repo.formulation.FormulationContext;
import fr.formcraft.repo.formulation.FormulationHandler;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Handler 2: Calculates the total production cost by weighting
 * each ingredient's cost_per_kg by its composition percentage.
 */
@Component
public class CostFormulationHandler implements FormulationHandler {

    private static final Log logger = LogFactory.getLog(CostFormulationHandler.class);

    private FormulationHandler next;

    @Override
    public void handle(FormulationContext context) {
        if (logger.isDebugEnabled()) {
            logger.debug("Running CostFormulationHandler for product=" + context.getProduct().getId());
        }

        List<CompositionLine> lines = context.getCompositionLines();
        double totalCost = 0.0;

        for (CompositionLine line : lines) {
            double fraction = line.getQuantityFraction();
            if (line.getIngredient().getCostPerKg() != null) {
                totalCost += line.getIngredient().getCostPerKg().doubleValue() * fraction;
            }
        }

        context.setTotalCost(Math.round(totalCost * 100.0) / 100.0);

        if (context.getTotalCost() <= 0.0 && !lines.isEmpty()) {
            context.addWarning("Product cost is zero — ensure ingredient costs are set");
        }

        if (logger.isDebugEnabled()) {
            logger.debug("Computed total cost=" + context.getTotalCost() + " EUR/kg");
        }

        if (next != null) {
            next.handle(context);
        }
    }

    @Override
    public FormulationHandler setNext(FormulationHandler next) {
        this.next = next;
        return this;
    }

    @Override
    public String getHandlerName() {
        return "CostFormulationHandler";
    }
}
