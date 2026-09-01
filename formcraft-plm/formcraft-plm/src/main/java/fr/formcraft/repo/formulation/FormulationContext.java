package fr.formcraft.repo.formulation;

import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.Product;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Mutable context object passed through the formulation chain.
 * Holds all data needed by each handler and collects results.
 * Mirrors beCPG's formulation context pattern.
 */
@Getter
@Setter
public class FormulationContext {

    private final Product product;
    private final String chainId;
    private final List<CompositionLine> compositionLines;

    /** Computed nutrient values (nutrientType -> value per 100g of product). */
    private final Map<String, Double> computedNutrients = new HashMap<>();

    /** Arbitrary key-value store for handler communication. */
    private final Map<String, Object> attributes = new HashMap<>();

    private final List<String> errors   = new ArrayList<>();
    private final List<String> warnings = new ArrayList<>();

    private String nutriScore;
    private String ecoScore;
    private double totalCost = 0.0;
    private double formulaResult = 0.0;
    private boolean aborted = false;

    public FormulationContext(Product product, String chainId, List<CompositionLine> compositionLines) {
        this.product = product;
        this.chainId = chainId;
        this.compositionLines = compositionLines;
    }

    public void addError(String error) {
        this.errors.add(error);
    }

    public void addWarning(String warning) {
        this.warnings.add(warning);
    }

    public void putNutrient(String key, double value) {
        this.computedNutrients.put(key, value);
    }

    public double getNutrient(String key) {
        return computedNutrients.getOrDefault(key, 0.0);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }

    public String getStatus() {
        if (aborted || !errors.isEmpty()) {
            return "ERROR";
        }
        if (!warnings.isEmpty()) {
            return "WARNING";
        }
        return "OK";
    }

    public String getErrorsSummary() {
        return String.join("; ", errors);
    }

    public String getWarningsSummary() {
        return String.join("; ", warnings);
    }
}
