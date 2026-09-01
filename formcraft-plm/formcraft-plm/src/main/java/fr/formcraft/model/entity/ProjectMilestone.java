package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import fr.formcraft.model.enums.MilestoneStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A stage-gate milestone within an NPD project. */
@Entity
@Table(name = "project_milestones")
@Getter
@Setter
@NoArgsConstructor
public class ProjectMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "gate_number", nullable = false)
    private Integer gateNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MilestoneStatus status = MilestoneStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
