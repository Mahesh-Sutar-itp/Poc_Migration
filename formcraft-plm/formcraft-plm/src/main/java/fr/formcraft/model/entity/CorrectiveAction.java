package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import fr.formcraft.model.enums.CapaStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A corrective/preventive action (CAPA) item tied to a non-conformance. */
@Entity
@Table(name = "corrective_actions")
@Getter
@Setter
@NoArgsConstructor
public class CorrectiveAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "non_conformance_id", nullable = false)
    @JsonIgnore
    private NonConformance nonConformance;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String owner;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CapaStatus status = CapaStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "closed_at")
    private LocalDateTime closedAt;
}
