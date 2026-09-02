package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Approved-supplier link: which supplier can provide which raw material, at what price/lead time. */
@Entity
@Table(name = "supplier_products")
@Getter
@Setter
@NoArgsConstructor
public class SupplierProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    @JsonIgnore
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"compositionLines", "nutrientValues", "formulationResults", "workflowTasks", "qualityChecks"})
    private Product product;

    @Column(name = "price_per_kg", precision = 12, scale = 4)
    private BigDecimal pricePerKg;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "moq", precision = 12, scale = 4)
    private BigDecimal moq;

    @Column(nullable = false)
    private boolean preferred = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
