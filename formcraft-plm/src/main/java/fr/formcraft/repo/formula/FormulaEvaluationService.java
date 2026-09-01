package fr.formcraft.repo.formula;

import fr.formcraft.common.exception.FormCraftException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Evaluates SPEL-based formula expressions on products.
 *
 * <p>Mirrors beCPG's SPEL formula evaluation in its formulation engine.
 * Expressions can reference nutrient variable names, e.g.:
 * {@code "protein * 4 + fat * 9 + carbohydrates * 4"}</p>
 *
 * <p>Uses {@link SimpleEvaluationContext} (read-only, no method invocations)
 * to prevent arbitrary code execution.</p>
 */
@Service
public class FormulaEvaluationService {

    private static final Log logger = LogFactory.getLog(FormulaEvaluationService.class);

    private final ExpressionParser spelParser = new SpelExpressionParser();

    /**
     * Evaluates a SPEL expression with the given variable bindings.
     *
     * @param expression the SPEL expression string
     * @param variables  map of variable names to their double values
     * @return the evaluated numeric result
     * @throws FormCraftException if the expression is invalid or evaluation fails
     */
    public double evaluate(String expression, Map<String, Object> variables) {
        if (expression == null || expression.isBlank()) {
            throw new FormCraftException("Formula expression must not be blank");
        }

        if (logger.isDebugEnabled()) {
            logger.debug("Evaluating SPEL expression: '" + expression + "' with variables=" + variables.keySet());
        }

        try {
            EvaluationContext context = buildEvaluationContext(variables);
            Expression parsedExpression = spelParser.parseExpression(expression);
            Number result = parsedExpression.getValue(context, Number.class);

            if (result == null) {
                throw new FormCraftException("Expression returned null result: " + expression);
            }

            return result.doubleValue();
        } catch (FormCraftException e) {
            throw e;
        } catch (Exception e) {
            throw new FormCraftException("Failed to evaluate formula '" + expression + "': " + e.getMessage(), e);
        }
    }

    /**
     * Validates a formula expression without evaluating it.
     *
     * @param expression the expression to validate
     * @return true if valid SPEL syntax
     */
    public boolean isValidExpression(String expression) {
        if (expression == null || expression.isBlank()) {
            return false;
        }
        try {
            spelParser.parseExpression(expression);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private EvaluationContext buildEvaluationContext(Map<String, Object> variables) {
        SimpleEvaluationContext context = SimpleEvaluationContext
                .forReadOnlyDataBinding()
                .build();

        // Register each variable as a root-accessible property
        variables.forEach(context::setVariable);

        return context;
    }
}
