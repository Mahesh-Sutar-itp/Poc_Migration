package fr.formcraft.repo.attributes.impl;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.CustomAttributeDefinition;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.CustomAttributeType;
import fr.formcraft.repo.jpa.CustomAttributeDefinitionRepository;
import fr.formcraft.sdk.attributes.CustomAttributeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service("customAttributeService")
public class CustomAttributeServiceImpl implements CustomAttributeService {

    private final CustomAttributeDefinitionRepository definitionRepository;

    @Autowired
    public CustomAttributeServiceImpl(CustomAttributeDefinitionRepository definitionRepository) {
        this.definitionRepository = definitionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomAttributeDefinition> listDefinitions() {
        return definitionRepository.findAll();
    }

    @Override
    @Transactional
    public CustomAttributeDefinition defineAttribute(CustomAttributeDefinition definition) {
        if (definitionRepository.existsByAttributeKey(definition.getAttributeKey())) {
            throw new FormCraftException("Attribute '" + definition.getAttributeKey() + "' is already defined");
        }
        return definitionRepository.save(definition);
    }

    @Override
    @Transactional(readOnly = true)
    public void validate(Product product) {
        Map<String, Object> attributes = product.getCustomAttributes() != null
                ? product.getCustomAttributes() : Map.of();

        List<String> violations = new ArrayList<>();
        for (CustomAttributeDefinition def : definitionRepository.findAll()) {
            if (def.getAppliesToProductType() != null && def.getAppliesToProductType() != product.getProductType()) {
                continue;
            }
            validateOne(def, attributes.get(def.getAttributeKey()), violations);
        }

        if (!violations.isEmpty()) {
            throw new FormCraftException("Custom attribute validation failed: " + String.join("; ", violations));
        }
    }

    private void validateOne(CustomAttributeDefinition def, Object value, List<String> violations) {
        if (value == null || value.toString().isBlank()) {
            if (def.isRequired()) {
                violations.add("Attribute '" + def.getAttributeKey() + "' is required");
            }
            return;
        }

        if (!matchesType(value, def.getDataType())) {
            violations.add("Attribute '" + def.getAttributeKey() + "' must be of type " + def.getDataType());
        } else if (def.getValidationRegex() != null && !def.getValidationRegex().isBlank()
                && !value.toString().matches(def.getValidationRegex())) {
            violations.add("Attribute '" + def.getAttributeKey() + "' does not match the required format");
        }
    }

    private boolean matchesType(Object value, CustomAttributeType type) {
        String s = value.toString();
        return switch (type) {
            case STRING -> true;
            case NUMBER -> s.matches("-?\\d+(\\.\\d+)?");
            case BOOLEAN -> s.equalsIgnoreCase("true") || s.equalsIgnoreCase("false");
            case DATE -> s.matches("\\d{4}-\\d{2}-\\d{2}");
        };
    }
}
