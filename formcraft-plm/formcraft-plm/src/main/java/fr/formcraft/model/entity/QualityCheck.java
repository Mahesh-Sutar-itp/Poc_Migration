package fr.formcraft.model.entity;

import fr.formcraft.model.enums.QualityCheckStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

/** A quality check performed on a product. */
@Entity
@Table(name = "quality_checks")
@Getter
@Setter
@NoArgsConstructor
public class QualityCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(name = "check_type", nullable = false, length = 50)
    private String checkType;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QualityCheckStatus status;

    @Column(name = "checked_by", length = 100)
    private String checkedBy;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt = LocalDateTime.now();
}
