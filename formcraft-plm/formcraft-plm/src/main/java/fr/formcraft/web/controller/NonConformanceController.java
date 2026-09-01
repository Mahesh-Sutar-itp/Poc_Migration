package fr.formcraft.web.controller;

import fr.formcraft.model.entity.CorrectiveAction;
import fr.formcraft.model.entity.NonConformance;
import fr.formcraft.model.enums.NcSeverity;
import fr.formcraft.model.enums.NcStatus;
import fr.formcraft.repo.nonconformance.NonConformanceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
public class NonConformanceController {

    private final NonConformanceService nonConformanceService;

    @Autowired
    public NonConformanceController(NonConformanceService nonConformanceService) {
        this.nonConformanceService = nonConformanceService;
    }

    @GetMapping("/non-conformances")
    public ResponseEntity<List<NonConformance>> getAll() {
        return ResponseEntity.ok(nonConformanceService.getAll());
    }

    @GetMapping("/non-conformances/{id}")
    public ResponseEntity<NonConformance> getById(@PathVariable Long id) {
        return ResponseEntity.ok(nonConformanceService.getById(id));
    }

    @GetMapping("/products/{productId}/non-conformances")
    public ResponseEntity<List<NonConformance>> getForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(nonConformanceService.getForProduct(productId));
    }

    @PostMapping("/products/{productId}/non-conformances")
    public ResponseEntity<NonConformance> raise(@PathVariable Long productId,
                                                 @Valid @RequestBody RaiseRequest request,
                                                 Authentication auth) {
        NonConformance nc = nonConformanceService.raise(productId, request.qualityCheckId(), request.title(),
                request.description(), request.severity(), auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(nc);
    }

    @PostMapping("/non-conformances/{id}/transition")
    public ResponseEntity<NonConformance> transition(@PathVariable Long id, @RequestParam NcStatus target) {
        return ResponseEntity.ok(nonConformanceService.transitionStatus(id, target));
    }

    @PostMapping("/non-conformances/{id}/close")
    public ResponseEntity<NonConformance> close(@PathVariable Long id) {
        return ResponseEntity.ok(nonConformanceService.close(id));
    }

    @GetMapping("/non-conformances/{id}/actions")
    public ResponseEntity<List<CorrectiveAction>> getActions(@PathVariable Long id) {
        return ResponseEntity.ok(nonConformanceService.getCorrectiveActions(id));
    }

    @PostMapping("/non-conformances/{id}/actions")
    public ResponseEntity<CorrectiveAction> addAction(@PathVariable Long id,
                                                       @Valid @RequestBody CapaRequest request) {
        CorrectiveAction action = nonConformanceService.addCorrectiveAction(id, request.description(),
                request.owner(), request.dueDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(action);
    }

    @PostMapping("/non-conformances/{id}/actions/{actionId}/close")
    public ResponseEntity<CorrectiveAction> closeAction(@PathVariable Long id, @PathVariable Long actionId) {
        return ResponseEntity.ok(nonConformanceService.closeCorrectiveAction(id, actionId));
    }

    @GetMapping("/non-conformances/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
                "open", nonConformanceService.countByStatus(NcStatus.OPEN),
                "inProgress", nonConformanceService.countByStatus(NcStatus.IN_PROGRESS),
                "closed", nonConformanceService.countByStatus(NcStatus.CLOSED)
        ));
    }

    public record RaiseRequest(
            @NotBlank String title,
            String description,
            @NotNull NcSeverity severity,
            Long qualityCheckId
    ) {}

    public record CapaRequest(
            @NotBlank String description,
            String owner,
            LocalDate dueDate
    ) {}
}
