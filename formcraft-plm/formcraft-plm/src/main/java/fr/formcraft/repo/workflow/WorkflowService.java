package fr.formcraft.repo.workflow;

import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.WorkflowTask;
import fr.formcraft.model.enums.ProductState;

import java.util.List;

/**
 * Workflow service — manages product state machine transitions
 * and associated task assignments.
 */
public interface WorkflowService {

    /**
     * Transition a product to a new lifecycle state.
     *
     * @param productId the product to transition
     * @param targetState the desired target state
     * @param comment optional comment for the transition
     * @return the updated product
     */
    Product transitionState(Long productId, ProductState targetState, String comment);

    /**
     * Submit a product for validation (DRAFT -> IN_VALIDATION).
     * Creates validation tasks for reviewers.
     *
     * @param productId the product to submit
     * @param assignee the reviewer's username
     * @return the updated product
     */
    Product submitForValidation(Long productId, String assignee);

    /**
     * Approve a product (IN_VALIDATION -> VALIDATED).
     *
     * @param productId the product to approve
     * @return the updated product
     */
    Product approve(Long productId);

    /**
     * Reject a product back to DRAFT (IN_VALIDATION -> DRAFT).
     *
     * @param productId the product to reject
     * @param reason the rejection reason
     * @return the updated product
     */
    Product reject(Long productId, String reason);

    /**
     * Archive a validated product (VALIDATED -> ARCHIVED).
     *
     * @param productId the product to archive
     * @return the updated product
     */
    Product archive(Long productId);

    List<WorkflowTask> getTasksForProduct(Long productId);

    List<WorkflowTask> getTasksForUser(String username);

    WorkflowTask completeTask(Long taskId);
}
