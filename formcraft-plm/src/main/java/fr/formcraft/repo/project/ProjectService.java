package fr.formcraft.repo.project;

import fr.formcraft.model.entity.Project;
import fr.formcraft.model.entity.ProjectMilestone;
import fr.formcraft.model.enums.ProjectStatus;

import java.time.LocalDate;
import java.util.List;

public interface ProjectService {

    List<Project> findAll();

    Project getById(Long id);

    Project createProject(String name, String description, String owner, LocalDate targetLaunchDate);

    Project updateStatus(Long id, ProjectStatus status);

    void linkProduct(Long projectId, Long productId);

    void unlinkProduct(Long projectId, Long productId);

    ProjectMilestone addMilestone(Long projectId, String name, int gateNumber, LocalDate dueDate);

    ProjectMilestone updateMilestoneStatus(Long projectId, Long milestoneId, fr.formcraft.model.enums.MilestoneStatus status);

    void deleteProject(Long id);
}
