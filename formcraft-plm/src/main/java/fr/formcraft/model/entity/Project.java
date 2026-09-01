package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import fr.formcraft.model.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** A New Product Development (NPD) project following a stage-gate process. */
@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status = ProjectStatus.PLANNING;

    @Column(length = 100)
    private String owner;

    @Column(name = "target_launch_date")
    private LocalDate targetLaunchDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToMany
    @JoinTable(
            name = "project_products",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    @JsonIgnoreProperties({"compositionLines", "nutrientValues", "formulationResults", "workflowTasks", "qualityChecks"})
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("gateNumber ASC")
    private List<ProjectMilestone> milestones = new ArrayList<>();
}
