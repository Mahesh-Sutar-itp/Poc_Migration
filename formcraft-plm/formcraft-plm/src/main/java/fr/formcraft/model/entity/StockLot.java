package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** A tracked batch/lot of a raw material held in inventory. */
@Entity
@Table(name = "stock_lots")
@Getter
@Setter
@NoArgsConstructor
public class StockLot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"compositionLines", "nutrientValues", "formulationResults", "workflowTasks", "qualityChecks"})
    private Product product;

    @Column(name = "lot_number", nullable = false, length = 100)
    private String lotNumber;

    @Column(name = "quantity_on_hand", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantityOnHand;

    @Column(length = 20)
    private String unit;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    @JsonIgnore
    private Supplier supplier;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt = LocalDateTime.now();

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "stockLot", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<StockMovement> movements = new ArrayList<>();
}
