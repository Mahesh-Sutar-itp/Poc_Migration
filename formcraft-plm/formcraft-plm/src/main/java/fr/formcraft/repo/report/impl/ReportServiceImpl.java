package fr.formcraft.repo.report.impl;

import fr.formcraft.common.constants.RepoConsts;
import fr.formcraft.model.entity.AuditLog;
import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.CapaStatus;
import fr.formcraft.model.enums.ChangeRequestStatus;
import fr.formcraft.model.enums.NcStatus;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.model.enums.ProjectStatus;
import fr.formcraft.model.enums.QualityCheckStatus;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.jpa.ChangeRequestRepository;
import fr.formcraft.repo.jpa.CompositionLineRepository;
import fr.formcraft.repo.jpa.CorrectiveActionRepository;
import fr.formcraft.repo.jpa.NonConformanceRepository;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.ProjectRepository;
import fr.formcraft.repo.jpa.QualityCheckRepository;
import fr.formcraft.repo.notification.NotificationService;
import fr.formcraft.repo.report.ReportService;
import fr.formcraft.repo.inventory.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service("reportService")
public class ReportServiceImpl implements ReportService {

    private static final List<String> KNOWN_ALLERGENS = List.of(
            RepoConsts.ALLERGEN_GLUTEN, RepoConsts.ALLERGEN_EGGS, RepoConsts.ALLERGEN_MILK,
            RepoConsts.ALLERGEN_NUTS, RepoConsts.ALLERGEN_SOY, RepoConsts.ALLERGEN_FISH,
            RepoConsts.ALLERGEN_SHELLFISH, RepoConsts.ALLERGEN_SESAME);

    private final ProductRepository productRepository;
    private final CompositionLineRepository compositionLineRepository;
    private final QualityCheckRepository qualityCheckRepository;
    private final NonConformanceRepository nonConformanceRepository;
    private final CorrectiveActionRepository correctiveActionRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final ProjectRepository projectRepository;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Autowired
    public ReportServiceImpl(ProductRepository productRepository,
                              CompositionLineRepository compositionLineRepository,
                              QualityCheckRepository qualityCheckRepository,
                              NonConformanceRepository nonConformanceRepository,
                              CorrectiveActionRepository correctiveActionRepository,
                              ChangeRequestRepository changeRequestRepository,
                              ProjectRepository projectRepository,
                              InventoryService inventoryService,
                              NotificationService notificationService,
                              AuditService auditService) {
        this.productRepository = productRepository;
        this.compositionLineRepository = compositionLineRepository;
        this.qualityCheckRepository = qualityCheckRepository;
        this.nonConformanceRepository = nonConformanceRepository;
        this.correctiveActionRepository = correctiveActionRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.projectRepository = projectRepository;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardSummary(String username) {
        Map<String, Object> summary = new LinkedHashMap<>();

        summary.put("productsByState", Map.of(
                "draft", productRepository.countByState(ProductState.DRAFT),
                "inValidation", productRepository.countByState(ProductState.IN_VALIDATION),
                "validated", productRepository.countByState(ProductState.VALIDATED),
                "archived", productRepository.countByState(ProductState.ARCHIVED)
        ));

        long activeChangeRequests = changeRequestRepository.countByStatus(ChangeRequestStatus.SUBMITTED)
                + changeRequestRepository.countByStatus(ChangeRequestStatus.UNDER_REVIEW);

        summary.put("openNonConformances", nonConformanceRepository.countByStatus(NcStatus.OPEN)
                + nonConformanceRepository.countByStatus(NcStatus.IN_PROGRESS));
        summary.put("pendingCorrectiveActions", correctiveActionRepository.countByStatus(CapaStatus.OPEN));
        summary.put("activeChangeRequests", activeChangeRequests);
        summary.put("projectsInProgress", projectRepository.countByStatus(ProjectStatus.IN_PROGRESS));
        summary.put("lowStockLots", inventoryService.getLowStock(null).size());
        summary.put("unreadNotifications", username != null ? notificationService.countUnread(username) : 0);

        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCostBreakdown(Long productId) {
        List<CompositionLine> lines = compositionLineRepository.findByProductIdWithIngredient(productId);
        List<Map<String, Object>> breakdown = new ArrayList<>();

        for (CompositionLine line : lines) {
            double fraction = line.getQuantityFraction();
            BigDecimal costPerKg = line.getIngredient().getCostPerKg();
            double contribution = costPerKg != null ? costPerKg.doubleValue() * fraction : 0.0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("ingredientId", line.getIngredient().getId());
            row.put("ingredientName", line.getIngredient().getName());
            row.put("quantity", line.getQuantity());
            row.put("unit", line.getUnit());
            row.put("costPerKg", costPerKg);
            row.put("contribution", Math.round(contribution * 10000.0) / 10000.0);
            breakdown.add(row);
        }

        return breakdown;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAllergenMatrix() {
        List<Product> products = productRepository.findByStateAndTypes(ProductState.VALIDATED,
                List.of(ProductType.FINISHED_PRODUCT, ProductType.SEMI_FINISHED));
        if (products.isEmpty()) {
            products = productRepository.findAll().stream()
                    .filter(p -> p.getProductType() == ProductType.FINISHED_PRODUCT
                            || p.getProductType() == ProductType.SEMI_FINISHED)
                    .toList();
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Product product : products) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("productId", product.getId());
            row.put("productName", product.getName());
            for (String allergen : KNOWN_ALLERGENS) {
                row.put(allergen, product.hasAllergen(allergen));
            }
            rows.add(row);
        }

        return Map.of("allergens", KNOWN_ALLERGENS, "products", rows);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getQualityPassRate() {
        long passed = qualityCheckRepository.countByStatus(QualityCheckStatus.PASSED);
        long failed = qualityCheckRepository.countByStatus(QualityCheckStatus.FAILED);
        long total = passed + failed;
        double rate = total == 0 ? 0.0 : (passed * 100.0) / total;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("passed", passed);
        result.put("failed", failed);
        result.put("passRate", Math.round(rate * 100.0) / 100.0);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentActivity(int limit) {
        List<AuditLog> logs = auditService.getRecentActivity(limit);
        List<Map<String, Object>> activity = new ArrayList<>();
        for (AuditLog log : logs) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("entityType", log.getEntityType());
            row.put("entityId", log.getEntityId());
            row.put("action", log.getAction());
            row.put("performedBy", log.getPerformedBy());
            row.put("details", log.getDetails());
            row.put("performedAt", log.getPerformedAt());
            activity.add(row);
        }
        return activity;
    }
}
