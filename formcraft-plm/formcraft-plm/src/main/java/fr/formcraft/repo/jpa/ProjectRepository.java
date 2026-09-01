package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.Project;
import fr.formcraft.model.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByProductsId(Long productId);

    long countByStatus(ProjectStatus status);
}
