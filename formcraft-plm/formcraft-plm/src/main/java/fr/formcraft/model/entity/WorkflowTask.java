package fr.formcraft.model.entity;

import fr.formcraft.model.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/** Workflow task assigned to a user for a product review step. */
@Entity
@Table(name = "workflow_tasks")
@Getter
@Setter
@NoArgsConstructor
public class WorkflowTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(name = "task_name", nullable = false, length = 100)
    private String taskName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String assignee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Exposes the owning product's id without serializing the full (lazy) Product graph.
     * Safe to call outside an active session: reading a proxy's identifier never triggers initialization.
     * Deliberately NOT named getProductId(): a JavaBean-style getter with that name gets picked up
     * by Hibernate's attribute resolution and shadows Spring Data's derived-query interpretation of
     * "findByProductId" as the nested path product.id, breaking WorkflowTaskRepository at startup.
     */
    @Transient
    @JsonProperty("productId")
    public Long resolveProductId() {
        return product != null ? product.getId() : null;
    }
}
