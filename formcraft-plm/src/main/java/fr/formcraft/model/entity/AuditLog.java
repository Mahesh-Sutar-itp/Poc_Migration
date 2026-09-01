package fr.formcraft.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Immutable audit trail entry for any entity action. */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "performed_at", nullable = false, updatable = false)
    private LocalDateTime performedAt = LocalDateTime.now();
}
