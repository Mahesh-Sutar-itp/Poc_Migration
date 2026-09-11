package fr.formcraft.sdk.report;

import fr.formcraft.model.entity.ReportTemplate;

import java.util.List;
import java.util.Map;

/**
 * Customization Gate 5 (RAC Report Builder-style): lets a client register named
 * report templates and run them on demand, without a schema migration or a core
 * code change.
 */
public interface ReportTemplateService {

    List<ReportTemplate> listTemplates();

    ReportTemplate defineTemplate(ReportTemplate template);

    ReportTemplate updateTemplate(String templateKey, ReportTemplate template);

    void deleteTemplate(String templateKey);

    List<Map<String, Object>> runTemplate(String templateKey);
}
