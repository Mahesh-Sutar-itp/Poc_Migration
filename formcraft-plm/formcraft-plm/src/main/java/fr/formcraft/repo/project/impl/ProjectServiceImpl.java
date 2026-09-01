package fr.formcraft.repo.project.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.Project;
import fr.formcraft.model.entity.ProjectMilestone;
import fr.formcraft.model.enums.MilestoneStatus;
import fr.formcraft.model.enums.ProjectStatus;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.ProjectMilestoneRepository;
import fr.formcraft.repo.jpa.ProjectRepository;
import fr.formcraft.repo.project.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service("projectService")
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final ProductRepository productRepository;

    @Autowired
    public ProjectServiceImpl(ProjectRepository projectRepository,
                               ProjectMilestoneRepository milestoneRepository,
                               ProductRepository productRepository) {
        this.projectRepository = projectRepository;
        this.milestoneRepository = milestoneRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Project getById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project", id));
    }

    @Override
    @Transactional
    public Project createProject(String name, String description, String owner, LocalDate targetLaunchDate) {
        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setOwner(owner);
        project.setTargetLaunchDate(targetLaunchDate);
        project.setStatus(ProjectStatus.PLANNING);
        return projectRepository.save(project);
    }

    @Override
    @Transactional
    public Project updateStatus(Long id, ProjectStatus status) {
        Project project = getById(id);
        project.setStatus(status);
        return projectRepository.save(project);
    }

    @Override
    @Transactional
    public void linkProduct(Long projectId, Long productId) {
        Project project = getById(projectId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));
        if (project.getProducts().stream().noneMatch(p -> p.getId().equals(productId))) {
            project.getProducts().add(product);
            projectRepository.save(project);
        }
    }

    @Override
    @Transactional
    public void unlinkProduct(Long projectId, Long productId) {
        Project project = getById(projectId);
        project.getProducts().removeIf(p -> p.getId().equals(productId));
        projectRepository.save(project);
    }

    @Override
    @Transactional
    public ProjectMilestone addMilestone(Long projectId, String name, int gateNumber, LocalDate dueDate) {
        Project project = getById(projectId);

        ProjectMilestone milestone = new ProjectMilestone();
        milestone.setProject(project);
        milestone.setName(name);
        milestone.setGateNumber(gateNumber);
        milestone.setDueDate(dueDate);
        milestone.setStatus(MilestoneStatus.PENDING);
        return milestoneRepository.save(milestone);
    }

    @Override
    @Transactional
    public ProjectMilestone updateMilestoneStatus(Long projectId, Long milestoneId, MilestoneStatus status) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new EntityNotFoundException("ProjectMilestone", milestoneId));

        if (!milestone.getProject().getId().equals(projectId)) {
            throw new FormCraftException("Milestone does not belong to project " + projectId);
        }

        milestone.setStatus(status);
        if (status == MilestoneStatus.DONE) {
            milestone.setCompletedAt(LocalDateTime.now());
        } else {
            milestone.setCompletedAt(null);
        }
        return milestoneRepository.save(milestone);
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        Project project = getById(id);
        projectRepository.delete(project);
    }
}
