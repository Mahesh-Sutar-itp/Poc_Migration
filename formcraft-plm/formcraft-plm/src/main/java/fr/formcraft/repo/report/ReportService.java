package fr.formcraft.repo.report;

import java.util.List;
import java.util.Map;

public interface ReportService {

    Map<String, Object> getDashboardSummary(String username);

    List<Map<String, Object>> getCostBreakdown(Long productId);

    Map<String, Object> getAllergenMatrix();

    Map<String, Object> getQualityPassRate();

    List<Map<String, Object>> getRecentActivity(int limit);
}
