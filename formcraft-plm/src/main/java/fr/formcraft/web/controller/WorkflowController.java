package fr.formcraft.web.controller;

import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.WorkflowTask;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.repo.workflow.WorkflowService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products/{productId}/workflow")
public class WorkflowController {

    private final WorkflowService workflowService;

    @Autowired
    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping("/submit")
    public ResponseEntity<Product> submit(@PathVariable Long productId,
                                           @RequestParam(required = false) String assignee,
                                           Authentication auth) {
        String reviewer = (assignee != null) ? assignee : auth.getName();
        return ResponseEntity.ok(workflowService.submitForValidation(productId, reviewer));
    }

    @PostMapping("/approve")
    public ResponseEntity<Product> approve(@PathVariable Long productId) {
        return ResponseEntity.ok(workflowService.approve(productId));
    }

    @PostMapping("/reject")
    public ResponseEntity<Product> reject(@PathVariable Long productId,
                                           @RequestParam @NotBlank String reason) {
        return ResponseEntity.ok(workflowService.reject(productId, reason));
    }

    @PostMapping("/archive")
    public ResponseEntity<Product> archive(@PathVariable Long productId) {
        return ResponseEntity.ok(workflowService.archive(productId));
    }

    @PostMapping("/transition")
    public ResponseEntity<Product> transition(@PathVariable Long productId,
                                               @RequestParam ProductState targetState,
                                               @RequestParam(required = false) String comment) {
        return ResponseEntity.ok(workflowService.transitionState(productId, targetState, comment));
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<WorkflowTask>> getTasks(@PathVariable Long productId) {
        return ResponseEntity.ok(workflowService.getTasksForProduct(productId));
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<WorkflowTask> completeTask(@PathVariable Long productId,
                                                      @PathVariable Long taskId) {
        return ResponseEntity.ok(workflowService.completeTask(taskId));
    }
}
