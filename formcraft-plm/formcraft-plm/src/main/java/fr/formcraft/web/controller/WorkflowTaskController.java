package fr.formcraft.web.controller;

import fr.formcraft.model.entity.WorkflowTask;
import fr.formcraft.repo.workflow.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** User-scoped workflow task queries (not tied to a single product). */
@RestController
@RequestMapping("/workflow")
public class WorkflowTaskController {

    private final WorkflowService workflowService;

    @Autowired
    public WorkflowTaskController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<List<WorkflowTask>> myTasks(Authentication auth) {
        return ResponseEntity.ok(workflowService.getTasksForUser(auth.getName()));
    }
}
