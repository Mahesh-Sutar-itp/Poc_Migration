package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import fr.formcraft.model.enums.NcSeverity;
import fr.formcraft.model.enums.NcStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** A quality non-conformance raised against a product (optionally linked to a failed quality check). */
@Entity
@Table(name = "non_conformances")
@Getter
@Setter
@NoArgsConstructor
public class NonConformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"compositionLines", "nutrientValues", "formulationResults", "workflowTasks", "qualityChecks"})
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quality_check_id")
    @JsonIgnore
    private QualityCheck qualityCheck;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NcSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NcStatus status = NcStatus.OPEN;

    @Column(name = "raised_by", length = 100)
    private String raisedBy;

    @Column(name = "raised_at", nullable = false, updatable = false)
    private LocalDateTime raisedAt = LocalDateTime.now();

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "nonConformance", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CorrectiveAction> correctiveActions = new ArrayList<>();
}
