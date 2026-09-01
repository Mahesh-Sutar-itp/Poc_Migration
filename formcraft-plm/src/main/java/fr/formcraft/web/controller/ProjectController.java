package fr.formcraft.web.controller;

import fr.formcraft.model.entity.Project;
import fr.formcraft.model.entity.ProjectMilestone;
import fr.formcraft.model.enums.MilestoneStatus;
import fr.formcraft.model.enums.ProjectStatus;
import fr.formcraft.repo.project.ProjectService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final ProjectService projectService;

    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> listProjects() {
        return ResponseEntity.ok(projectService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@Valid @RequestBody CreateProjectRequest request) {
        Project created = projectService.createProject(request.name(), request.description(),
                request.owner(), request.targetLaunchDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Project> updateStatus(@PathVariable Long id, @RequestParam ProjectStatus status) {
        return ResponseEntity.ok(projectService.updateStatus(id, status));
    }

    @PostMapping("/{id}/products/{productId}")
    public ResponseEntity<Void> linkProduct(@PathVariable Long id, @PathVariable Long productId) {
        projectService.linkProduct(id, productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/products/{productId}")
    public ResponseEntity<Void> unlinkProduct(@PathVariable Long id, @PathVariable Long productId) {
        projectService.unlinkProduct(id, productId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/milestones")
    public ResponseEntity<ProjectMilestone> addMilestone(@PathVariable Long id,
                                                          @Valid @RequestBody MilestoneRequest request) {
        ProjectMilestone milestone = projectService.addMilestone(id, request.name(), request.gateNumber(),
                request.dueDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(milestone);
    }

    @PutMapping("/{id}/milestones/{milestoneId}/status")
    public ResponseEntity<ProjectMilestone> updateMilestoneStatus(@PathVariable Long id,
                                                                   @PathVariable Long milestoneId,
                                                                   @RequestParam MilestoneStatus status) {
        return ResponseEntity.ok(projectService.updateMilestoneStatus(id, milestoneId, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateProjectRequest(@NotBlank String name, String description, String owner,
                                        LocalDate targetLaunchDate) {}

    public record MilestoneRequest(@NotBlank String name, @NotNull Integer gateNumber, LocalDate dueDate) {}
}
