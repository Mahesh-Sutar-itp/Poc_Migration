package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import fr.formcraft.model.enums.SpecType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A quality specification limit for a parameter on a product (e.g. moisture 8-12%). */
@Entity
@Table(name = "specifications")
@Getter
@Setter
@NoArgsConstructor
public class Specification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(nullable = false, length = 100)
    private String parameter;

    @Enumerated(EnumType.STRING)
    @Column(name = "spec_type", nullable = false, length = 30)
    private SpecType specType;

    @Column(name = "min_value", precision = 12, scale = 4)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 12, scale = 4)
    private BigDecimal maxValue;

    @Column(name = "target_value", precision = 12, scale = 4)
    private BigDecimal targetValue;

    @Column(length = 20)
    private String unit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by", length = 100)
    private String createdBy;

    public boolean isWithinLimits(double value) {
        if (minValue != null && value < minValue.doubleValue()) {
            return false;
        }
        return maxValue == null || !(value > maxValue.doubleValue());
    }
}
