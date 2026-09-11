package fr.formcraft.repo.report.impl;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.ReportTemplate;
import fr.formcraft.model.enums.TargetEntity;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.ReportTemplateRepository;
import fr.formcraft.sdk.report.ReportTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service("reportTemplateService")
public class ReportTemplateServiceImpl implements ReportTemplateService {

    private static final Map<String, Function<Product, Object>> PRODUCT_FIELD_ACCESSORS = Map.of(
            "code", Product::getCode,
            "name", Product::getName,
            "description", Product::getDescription,
            "productType", Product::getProductType,
            "state", Product::getState,
            "unit", Product::getUnit,
            "costPerKg", Product::getCostPerKg,
            "allergenFlags", Product::getAllergenFlags
    );

    private final ReportTemplateRepository repository;
    private final ProductRepository productRepository;

    @Autowired
    public ReportTemplateServiceImpl(ReportTemplateRepository repository, ProductRepository productRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportTemplate> listTemplates() {
        return repository.findAllByOrderByIdAsc();
    }

    @Override
    @Transactional
    public ReportTemplate defineTemplate(ReportTemplate template) {
        if (repository.existsByTemplateKey(template.getTemplateKey())) {
            throw new FormCraftException("Report template '" + template.getTemplateKey() + "' is already defined");
        }
        return repository.save(template);
    }

    @Override
    @Transactional
    public ReportTemplate updateTemplate(String templateKey, ReportTemplate template) {
        ReportTemplate existing = repository.findByTemplateKey(templateKey)
                .orElseThrow(() -> new FormCraftException("No report template: " + templateKey));
        existing.setName(template.getName());
        existing.setTargetEntity(template.getTargetEntity());
        existing.setFields(template.getFields());
        existing.setLabels(template.getLabels());
        return repository.save(existing);
    }

    @Override
    @Transactional
    public void deleteTemplate(String templateKey) {
        repository.deleteByTemplateKey(templateKey);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> runTemplate(String templateKey) {
        ReportTemplate template = repository.findByTemplateKey(templateKey)
                .orElseThrow(() -> new FormCraftException("No report template: " + templateKey));
        if (template.getTargetEntity() != TargetEntity.PRODUCT) {
            throw new FormCraftException("Unsupported target entity: " + template.getTargetEntity());
        }

        List<Product> products = productRepository.findAll();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Product product : products) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (String field : template.getFields()) {
                String label = template.getLabels().getOrDefault(field, field);
                Function<Product, Object> accessor = PRODUCT_FIELD_ACCESSORS.get(field);
                Object value = accessor != null ? accessor.apply(product) : product.getCustomAttributes().get(field);
                row.put(label, value);
            }
            rows.add(row);
        }
        return rows;
    }
}
