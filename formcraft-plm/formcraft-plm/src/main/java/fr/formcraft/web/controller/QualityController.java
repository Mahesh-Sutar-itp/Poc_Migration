package fr.formcraft.web.controller;

import fr.formcraft.model.entity.QualityCheck;
import fr.formcraft.repo.quality.QualityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products/{productId}/quality")
public class QualityController {

    private final QualityService qualityService;

    @Autowired
    public QualityController(QualityService qualityService) {
        this.qualityService = qualityService;
    }

    @PostMapping("/run-all")
    public ResponseEntity<List<QualityCheck>> runAllChecks(@PathVariable Long productId) {
        return ResponseEntity.ok(qualityService.runAllChecks(productId));
    }

    @PostMapping("/run/{checkType}")
    public ResponseEntity<QualityCheck> runCheck(@PathVariable Long productId,
                                                  @PathVariable String checkType) {
        return ResponseEntity.ok(qualityService.runCheck(productId, checkType));
    }

    @GetMapping
    public ResponseEntity<List<QualityCheck>> getChecks(@PathVariable Long productId) {
        return ResponseEntity.ok(qualityService.getChecksForProduct(productId));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus(@PathVariable Long productId) {
        return ResponseEntity.ok(Map.of(
                "allPassed", qualityService.allChecksPassed(productId)
        ));
    }
}
