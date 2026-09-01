package fr.formcraft.model.entity;

import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Core product entity — represents any node in the PLM system:
 * finished products, semi-finished, raw materials, or packaging.
 * Mirrors beCPG's entity/node concept.
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 30)
    private ProductType productType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProductState state = ProductState.DRAFT;

    @Column(length = 20)
    private String unit;

    @Column(name = "cost_per_kg", precision = 12, scale = 4)
    private BigDecimal costPerKg;

    /**
     * SPEL-based formula expression evaluated at formulation time.
     * Example: "protein * 4 + fat * 9 + carbohydrates * 4"
     * Variables are populated from the computed nutrient values.
     */
    @Column(name = "formula_expression", columnDefinition = "TEXT")
    private String formulaExpression;

    /**
     * Comma-separated allergen flags for quick lookup.
     * Example: "GLUTEN,EGGS,MILK"
     */
    @Column(name = "allergen_flags")
    private String allergenFlags;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Version
    private Long version;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC")
    private List<CompositionLine> compositionLines = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<NutrientValue> nutrientValues = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<FormulationResult> formulationResults = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WorkflowTask> workflowTasks = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<QualityCheck> qualityChecks = new ArrayList<>();

    public boolean hasAllergen(String allergen) {
        if (allergenFlags == null || allergenFlags.isBlank()) {
            return false;
        }
        return allergenFlags.contains(allergen);
    }

    public boolean isFinishedProduct() {
        return ProductType.FINISHED_PRODUCT == productType;
    }

    public boolean isRawMaterial() {
        return ProductType.RAW_MATERIAL == productType;
    }
}
