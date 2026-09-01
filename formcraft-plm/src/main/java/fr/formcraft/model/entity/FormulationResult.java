package fr.formcraft.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Stores the result of a formulation chain execution.
 * Computed values are stored as JSONB for flexible nutrient storage.
 */
@Entity
@Table(name = "formulation_results")
@Getter
@Setter
@NoArgsConstructor
public class FormulationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(name = "chain_id", nullable = false, length = 50)
    private String chainId;

    @Column(nullable = false, length = 20)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "computed_values", columnDefinition = "jsonb")
    private Map<String, Double> computedValues;

    @Column(name = "nutri_score", length = 5)
    private String nutriScore;

    @Column(name = "eco_score", length = 5)
    private String ecoScore;

    @Column(name = "total_cost", precision = 12, scale = 4)
    private BigDecimal totalCost;

    @Column(columnDefinition = "TEXT")
    private String errors;

    @Column(columnDefinition = "TEXT")
    private String warnings;

    @Column(name = "formulated_at", nullable = false)
    private LocalDateTime formulatedAt = LocalDateTime.now();
}
