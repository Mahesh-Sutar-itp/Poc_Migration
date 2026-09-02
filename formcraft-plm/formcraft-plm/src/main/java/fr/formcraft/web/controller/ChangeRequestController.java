package fr.formcraft.web.controller;

import fr.formcraft.model.entity.ChangeRequest;
import fr.formcraft.repo.changerequest.ChangeRequestService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ChangeRequestController {

    private final ChangeRequestService changeRequestService;

    @Autowired
    public ChangeRequestController(ChangeRequestService changeRequestService) {
        this.changeRequestService = changeRequestService;
    }

    @GetMapping("/change-requests")
    public ResponseEntity<List<ChangeRequest>> getAll() {
        return ResponseEntity.ok(changeRequestService.getAll());
    }

    @GetMapping("/change-requests/{id}")
    public ResponseEntity<ChangeRequest> getById(@PathVariable Long id) {
        return ResponseEntity.ok(changeRequestService.getById(id));
    }

    @GetMapping("/products/{productId}/change-requests")
    public ResponseEntity<List<ChangeRequest>> getForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(changeRequestService.getForProduct(productId));
    }

    @PostMapping("/products/{productId}/change-requests")
    public ResponseEntity<ChangeRequest> create(@PathVariable Long productId,
                                                 @Valid @RequestBody CreateRequest request,
                                                 Authentication auth) {
        ChangeRequest created = changeRequestService.create(productId, request.title(), request.description(),
                request.reason(), request.impact(), auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/change-requests/{id}/submit")
    public ResponseEntity<ChangeRequest> submit(@PathVariable Long id) {
        return ResponseEntity.ok(changeRequestService.submit(id));
    }

    @PostMapping("/change-requests/{id}/decide")
    public ResponseEntity<ChangeRequest> decide(@PathVariable Long id,
                                                 @Valid @RequestBody DecisionRequest request,
                                                 Authentication auth) {
        return ResponseEntity.ok(changeRequestService.decide(id, request.approve(), auth.getName(), request.comment()));
    }

    @PostMapping("/change-requests/{id}/implement")
    public ResponseEntity<ChangeRequest> implement(@PathVariable Long id) {
        return ResponseEntity.ok(changeRequestService.implement(id));
    }

    public record CreateRequest(@NotBlank String title, String description, String reason, String impact) {}

    public record DecisionRequest(boolean approve, String comment) {}
}
