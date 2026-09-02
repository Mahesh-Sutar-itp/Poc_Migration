package fr.formcraft.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Composition line — one entry in a product's Bill of Materials.
 * Links a finished/semi-finished product to an ingredient with a quantity.
 */
@Entity
@Table(name = "composition_lines")
@Getter
@Setter
@NoArgsConstructor
public class CompositionLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    @JsonIgnoreProperties({"compositionLines", "nutrientValues", "formulationResults", "workflowTasks", "qualityChecks"})
    private Product ingredient;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;

    @Column(precision = 6, scale = 4)
    private BigDecimal percentage;

    @Column(length = 20)
    private String unit;

    @Column(name = "is_allergen")
    private Boolean isAllergen = false;

    @Column(name = "position")
    private Integer position = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Returns quantity as a percentage fraction (0.0 to 1.0) for calculations.
     */
    public double getQuantityFraction() {
        if (percentage != null) {
            return percentage.doubleValue() / 100.0;
        }
        return quantity.doubleValue() / 100.0;
    }
}
