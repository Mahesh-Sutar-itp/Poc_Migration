package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.WorkflowTask;
import fr.formcraft.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowTaskRepository extends JpaRepository<WorkflowTask, Long> {

    List<WorkflowTask> findByProductId(Long productId);

    List<WorkflowTask> findByAssigneeAndStatus(String assignee, TaskStatus status);

    List<WorkflowTask> findByProductIdAndStatus(Long productId, TaskStatus status);
}
