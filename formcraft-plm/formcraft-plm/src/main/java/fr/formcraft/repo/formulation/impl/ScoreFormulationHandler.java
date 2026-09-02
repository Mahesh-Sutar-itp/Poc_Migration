package fr.formcraft.repo.formulation.impl;

import fr.formcraft.common.constants.RepoConsts;
import fr.formcraft.repo.formulation.FormulationContext;
import fr.formcraft.repo.formulation.FormulationHandler;
import fr.formcraft.repo.formula.FormulaEvaluationService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Handler 4: Computes the NutriScore grade (A–E) based on the
 * calculated nutritional profile, and evaluates the product's
 * SPEL formula expression if one is defined.
 *
 * <p>NutriScore algorithm (simplified):
 * Points = (energy + saturatedFat + sugar + salt) - (fiber + protein)
 * A: ≤ -1, B: 0–2, C: 3–10, D: 11–18, E: ≥ 19</p>
 */
@Component
public class ScoreFormulationHandler implements FormulationHandler {

    private static final Log logger = LogFactory.getLog(ScoreFormulationHandler.class);

    private final FormulaEvaluationService formulaEvaluationService;
    private FormulationHandler next;

    @Autowired
    public ScoreFormulationHandler(FormulaEvaluationService formulaEvaluationService) {
        this.formulaEvaluationService = formulaEvaluationService;
    }

    @Override
    public void handle(FormulationContext context) {
        if (logger.isDebugEnabled()) {
            logger.debug("Running ScoreFormulationHandler for product=" + context.getProduct().getId());
        }

        computeNutriScore(context);
        evaluateFormulaExpression(context);

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
        return "ScoreFormulationHandler";
    }

    private void computeNutriScore(FormulationContext context) {
        double energy       = context.getNutrient("ENERGY_KCAL") / 335.0 * 10;
        double saturatedFat = context.getNutrient("SATURATED_FAT") / 10.0 * 10;
        double sugars       = context.getNutrient("SUGARS") / 45.0 * 10;
        double salt         = context.getNutrient("SALT") / 6.0 * 10;
        double fiber        = Math.min(context.getNutrient("FIBER") / 4.7 * 5, 5);
        double protein      = Math.min(context.getNutrient("PROTEIN") / 8.0 * 5, 5);

        double score = (energy + saturatedFat + sugars + salt) - (fiber + protein);

        String nutriScore = computeGrade(score);
        context.setNutriScore(nutriScore);
        context.putNutrient("NUTRI_SCORE_POINTS", Math.round(score * 10.0) / 10.0);

        if (logger.isDebugEnabled()) {
            logger.debug("NutriScore computed: score=" + score + " grade=" + nutriScore);
        }
    }

    private String computeGrade(double score) {
        if (score <= -1)  return RepoConsts.NUTRI_SCORE_A;
        if (score <= 2)   return RepoConsts.NUTRI_SCORE_B;
        if (score <= 10)  return RepoConsts.NUTRI_SCORE_C;
        if (score <= 18)  return RepoConsts.NUTRI_SCORE_D;
        return RepoConsts.NUTRI_SCORE_E;
    }

    private void evaluateFormulaExpression(FormulationContext context) {
        String expression = context.getProduct().getFormulaExpression();

        if (expression == null || expression.isBlank()) {
            return;
        }

        try {
            Map<String, Object> variables = Map.of(
                    "protein",       context.getNutrient("PROTEIN"),
                    "fat",           context.getNutrient("FAT"),
                    "carbohydrates", context.getNutrient("CARBOHYDRATES"),
                    "fiber",         context.getNutrient("FIBER"),
                    "salt",          context.getNutrient("SALT"),
                    "energy",        context.getNutrient("ENERGY_KCAL")
            );

            double result = formulaEvaluationService.evaluate(expression, variables);
            context.setFormulaResult(result);
            context.putNutrient("FORMULA_RESULT", result);

            if (logger.isDebugEnabled()) {
                logger.debug("Formula '" + expression + "' evaluated to " + result);
            }
        } catch (Exception e) {
            context.addWarning("Formula evaluation failed for expression='" + expression
                    + "': " + e.getMessage());
        }
    }
}
