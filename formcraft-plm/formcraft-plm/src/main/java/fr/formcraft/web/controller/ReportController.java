package fr.formcraft.web.controller;

import fr.formcraft.repo.report.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    @Autowired
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<Map<String, Object>> dashboardSummary(Authentication auth) {
        return ResponseEntity.ok(reportService.getDashboardSummary(auth != null ? auth.getName() : null));
    }

    @GetMapping("/cost-breakdown/{productId}")
    public ResponseEntity<List<Map<String, Object>>> costBreakdown(@PathVariable Long productId) {
        return ResponseEntity.ok(reportService.getCostBreakdown(productId));
    }

    @GetMapping("/allergen-matrix")
    public ResponseEntity<Map<String, Object>> allergenMatrix() {
        return ResponseEntity.ok(reportService.getAllergenMatrix());
    }

    @GetMapping("/quality-pass-rate")
    public ResponseEntity<Map<String, Object>> qualityPassRate() {
        return ResponseEntity.ok(reportService.getQualityPassRate());
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> recentActivity(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(reportService.getRecentActivity(limit));
    }
}
