package fr.formcraft.repo.workflow.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.WorkflowTask;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.TaskStatus;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.WorkflowTaskRepository;
import fr.formcraft.repo.workflow.WorkflowService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service("workflowService")
public class WorkflowServiceImpl implements WorkflowService {

    private static final Log logger = LogFactory.getLog(WorkflowServiceImpl.class);

    private final ProductRepository productRepository;
    private final WorkflowTaskRepository workflowTaskRepository;
    private final AuditService auditService;

    @Autowired
    public WorkflowServiceImpl(ProductRepository productRepository,
                                WorkflowTaskRepository workflowTaskRepository,
                                AuditService auditService) {
        this.productRepository = productRepository;
        this.workflowTaskRepository = workflowTaskRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public Product transitionState(Long productId, ProductState targetState, String comment) {
        Product product = getProduct(productId);
        ProductState fromState = product.getState();

        if (!fromState.canTransitionTo(targetState)) {
            throw new FormCraftException("Invalid state transition: " + fromState + " -> " + targetState
                    + " for product " + productId);
        }

        product.setState(targetState);
        Product saved = productRepository.save(product);

        auditService.logWorkflowTransition(productId, fromState.name(), targetState.name());

        if (logger.isDebugEnabled()) {
            logger.debug("Product " + productId + " transitioned " + fromState + " -> " + targetState);
        }

        return saved;
    }

    @Override
    @Transactional
    public Product submitForValidation(Long productId, String assignee) {
        Product product = transitionState(productId, ProductState.IN_VALIDATION, null);

        cancelExistingPendingTasks(productId);
        createTask(product, "Review Product Specification",
                "Review and validate the product specification sheet", assignee, 5);
        createTask(product, "Allergen Compliance Check",
                "Verify allergen declarations are complete and accurate", assignee, 3);

        return product;
    }

    @Override
    @Transactional
    public Product approve(Long productId) {
        completeAllPendingTasks(productId);
        return transitionState(productId, ProductState.VALIDATED, "Approved");
    }

    @Override
    @Transactional
    public Product reject(Long productId, String reason) {
        cancelExistingPendingTasks(productId);

        Product product = transitionState(productId, ProductState.DRAFT, reason);

        WorkflowTask rejectionTask = new WorkflowTask();
        rejectionTask.setProduct(product);
        rejectionTask.setTaskName("Address Rejection Feedback");
        rejectionTask.setDescription("Product was rejected. Reason: " + reason);
        rejectionTask.setStatus(TaskStatus.PENDING);
        workflowTaskRepository.save(rejectionTask);

        return product;
    }

    @Override
    @Transactional
    public Product archive(Long productId) {
        return transitionState(productId, ProductState.ARCHIVED, "Archived");
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowTask> getTasksForProduct(Long productId) {
        return workflowTaskRepository.findByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowTask> getTasksForUser(String username) {
        return workflowTaskRepository.findByAssigneeAndStatus(username, TaskStatus.PENDING);
    }

    @Override
    @Transactional
    public WorkflowTask completeTask(Long taskId) {
        WorkflowTask task = workflowTaskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("WorkflowTask", taskId));

        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        return workflowTaskRepository.save(task);
    }

    private void createTask(Product product, String name, String description, String assignee, int dueDays) {
        WorkflowTask task = new WorkflowTask();
        task.setProduct(product);
        task.setTaskName(name);
        task.setDescription(description);
        task.setAssignee(assignee);
        task.setStatus(TaskStatus.PENDING);
        task.setDueDate(LocalDateTime.now().plusDays(dueDays));
        workflowTaskRepository.save(task);
    }

    private void cancelExistingPendingTasks(Long productId) {
        List<WorkflowTask> pendingTasks = workflowTaskRepository
                .findByProductIdAndStatus(productId, TaskStatus.PENDING);
        for (WorkflowTask task : pendingTasks) {
            task.setStatus(TaskStatus.CANCELLED);
        }
        workflowTaskRepository.saveAll(pendingTasks);
    }

    private void completeAllPendingTasks(Long productId) {
        List<WorkflowTask> pendingTasks = workflowTaskRepository
                .findByProductIdAndStatus(productId, TaskStatus.PENDING);
        for (WorkflowTask task : pendingTasks) {
            task.setStatus(TaskStatus.COMPLETED);
            task.setCompletedAt(LocalDateTime.now());
        }
        workflowTaskRepository.saveAll(pendingTasks);
    }

    private Product getProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));
    }
}
