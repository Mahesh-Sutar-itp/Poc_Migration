package fr.formcraft.model.entity;

import fr.formcraft.model.enums.NutrientType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;

/** Nutrient value per 100g for a raw material or ingredient. */
@Entity
@Table(name = "nutrient_values",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "nutrient_type"}))
@Getter
@Setter
@NoArgsConstructor
public class NutrientValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "nutrient_type", nullable = false, length = 30)
    private NutrientType nutrientType;

    @Column(name = "value_per_100g", nullable = false, precision = 10, scale = 4)
    private BigDecimal valuePer100g;

    @Column(length = 10)
    private String unit = "g";

    public double getValuePer100gAsDouble() {
        return valuePer100g != null ? valuePer100g.doubleValue() : 0.0;
    }
}
