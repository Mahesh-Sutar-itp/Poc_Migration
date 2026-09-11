package fr.formcraft.web.controller;

import fr.formcraft.model.entity.ReportTemplate;
import fr.formcraft.model.enums.TargetEntity;
import fr.formcraft.sdk.report.ReportTemplateService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-facing endpoint for Customization Gate 5 (RAC Report Builder-style): define
 * and run named report templates without a schema migration or a Java code change.
 */
@RestController
@RequestMapping("/report-templates")
public class ReportTemplateController {

    private final ReportTemplateService reportTemplateService;

    @Autowired
    public ReportTemplateController(ReportTemplateService reportTemplateService) {
        this.reportTemplateService = reportTemplateService;
    }

    @GetMapping
    public ResponseEntity<List<ReportTemplate>> list() {
        return ResponseEntity.ok(reportTemplateService.listTemplates());
    }

    @PostMapping
    public ResponseEntity<ReportTemplate> create(@Valid @RequestBody DefineReportTemplateRequest request) {
        ReportTemplate template = toEntity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reportTemplateService.defineTemplate(template));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ReportTemplate> update(@PathVariable String key,
                                                  @Valid @RequestBody DefineReportTemplateRequest request) {
        return ResponseEntity.ok(reportTemplateService.updateTemplate(key, toEntity(request)));
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Void> delete(@PathVariable String key) {
        reportTemplateService.deleteTemplate(key);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{key}/run")
    public ResponseEntity<List<Map<String, Object>>> run(@PathVariable String key) {
        return ResponseEntity.ok(reportTemplateService.runTemplate(key));
    }

    private ReportTemplate toEntity(DefineReportTemplateRequest request) {
        ReportTemplate template = new ReportTemplate();
        template.setTemplateKey(request.templateKey());
        template.setName(request.name());
        template.setTargetEntity(request.targetEntity());
        template.setFields(request.fields());
        template.setLabels(request.labels());
        return template;
    }

    public record DefineReportTemplateRequest(
            @NotBlank String templateKey,
            @NotBlank String name,
            @NotNull TargetEntity targetEntity,
            List<String> fields,
            Map<String, String> labels
    ) {}
}
