package fr.formcraft.repo.formulation.impl;

import fr.formcraft.common.constants.RepoConsts;
import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.repo.formulation.FormulationContext;
import fr.formcraft.repo.formulation.FormulationHandler;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Handler 3: Validates allergen compliance.
 * Checks that product's declared allergen flags match
 * the allergens present in its composition ingredients.
 */
@Component
public class ComplianceFormulationHandler implements FormulationHandler {

    private static final Log logger = LogFactory.getLog(ComplianceFormulationHandler.class);

    private static final List<String> REGULATED_ALLERGENS = List.of(
            RepoConsts.ALLERGEN_GLUTEN, RepoConsts.ALLERGEN_EGGS, RepoConsts.ALLERGEN_MILK,
            RepoConsts.ALLERGEN_NUTS,   RepoConsts.ALLERGEN_SOY,  RepoConsts.ALLERGEN_FISH,
            RepoConsts.ALLERGEN_SHELLFISH, RepoConsts.ALLERGEN_SESAME
    );

    private FormulationHandler next;

    @Override
    public void handle(FormulationContext context) {
        if (logger.isDebugEnabled()) {
            logger.debug("Running ComplianceFormulationHandler for product=" + context.getProduct().getId());
        }

        List<CompositionLine> lines = context.getCompositionLines();
        String declaredAllergens = context.getProduct().getAllergenFlags();

        for (String allergen : REGULATED_ALLERGENS) {
            boolean presentInIngredients = lines.stream()
                    .anyMatch(line -> line.getIngredient().hasAllergen(allergen));

            boolean declared = declaredAllergens != null && declaredAllergens.contains(allergen);

            if (presentInIngredients && !declared) {
                context.addError("Undeclared allergen detected: " + allergen
                        + " is present in composition but not declared on product label");
            } else if (!presentInIngredients && declared) {
                context.addWarning("Allergen " + allergen
                        + " is declared but not found in composition ingredients");
            }
        }

        validateCompositionTotal(context, lines);

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
        return "ComplianceFormulationHandler";
    }

    private void validateCompositionTotal(FormulationContext context, List<CompositionLine> lines) {
        double totalPercentage = lines.stream()
                .mapToDouble(CompositionLine::getQuantityFraction)
                .sum() * 100.0;

        double deviation = Math.abs(totalPercentage - 100.0);

        if (deviation > 1.0) {
            context.addError(String.format(
                    "Composition total is %.2f%% — must be 100%% (deviation: %.2f%%)",
                    totalPercentage, deviation));
        } else if (deviation > 0.01) {
            context.addWarning(String.format(
                    "Composition total is %.4f%% — minor rounding deviation detected",
                    totalPercentage));
        }
    }
}
