package fr.formcraft.repo.formulation.impl;

import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.NutrientValue;
import fr.formcraft.model.enums.NutrientType;
import fr.formcraft.repo.formulation.FormulationContext;
import fr.formcraft.repo.formulation.FormulationHandler;
import fr.formcraft.repo.jpa.NutrientValueRepository;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Handler 1: Calculates weighted nutritional values for the product
 * by summing ingredient nutrients weighted by their composition percentages.
 *
 * <p>For each nutrient N: productNutrient_N = Σ (ingredient_i.N * quantity_i / 100)</p>
 */
@Component
public class NutritionalFormulationHandler implements FormulationHandler {

    private static final Log logger = LogFactory.getLog(NutritionalFormulationHandler.class);

    private final NutrientValueRepository nutrientValueRepository;
    private FormulationHandler next;

    @Autowired
    public NutritionalFormulationHandler(NutrientValueRepository nutrientValueRepository) {
        this.nutrientValueRepository = nutrientValueRepository;
    }

    @Override
    public void handle(FormulationContext context) {
        if (logger.isDebugEnabled()) {
            logger.debug("Running NutritionalFormulationHandler for product=" + context.getProduct().getId());
        }

        List<CompositionLine> lines = context.getCompositionLines();

        if (lines.isEmpty()) {
            context.addWarning("Product has no composition lines — nutritional values will be zero");
        }

        for (NutrientType nutrientType : NutrientType.values()) {
            double computedValue = computeNutrientForComposition(lines, nutrientType);
            context.putNutrient(nutrientType.name(), computedValue);
        }

        if (logger.isDebugEnabled()) {
            logger.debug("Nutritional computation complete: protein=" +
                    context.getNutrient("PROTEIN") + "g fat=" +
                    context.getNutrient("FAT") + "g carbs=" +
                    context.getNutrient("CARBOHYDRATES") + "g per 100g");
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
        return "NutritionalFormulationHandler";
    }

    private double computeNutrientForComposition(List<CompositionLine> lines, NutrientType nutrientType) {
        double total = 0.0;
        for (CompositionLine line : lines) {
            Long ingredientId = line.getIngredient().getId();
            double fraction = line.getQuantityFraction();

            double ingredientNutrientValue = nutrientValueRepository
                    .findByProductIdAndNutrientType(ingredientId, nutrientType)
                    .map(NutrientValue::getValuePer100gAsDouble)
                    .orElse(0.0);

            total += ingredientNutrientValue * fraction;
        }
        return Math.round(total * 1000.0) / 1000.0;
    }
}
