package fr.formcraft.repo.attributes.impl;

import fr.formcraft.model.entity.CustomAttributeDefinition;
import fr.formcraft.model.enums.CustomAttributeType;
import fr.formcraft.model.enums.ProductType;

/**
 * JSON shape of one Gate 2 custom attribute definition as persisted in a
 * customization repo's {@code UI-product-attributes-config/product-attributes.json}
 * file. Deliberately independent of the {@link CustomAttributeDefinition} JPA entity
 * (no id / createdAt) so the config file only ever describes what a client asked for.
 */
public record CustomAttributeConfigEntry(
        String attributeKey,
        String label,
        CustomAttributeType dataType,
        boolean required,
        ProductType appliesToProductType,
        String validationRegex
) {

    static CustomAttributeConfigEntry from(CustomAttributeDefinition definition) {
        return new CustomAttributeConfigEntry(
                definition.getAttributeKey(),
                definition.getLabel(),
                definition.getDataType(),
                definition.isRequired(),
                definition.getAppliesToProductType(),
                definition.getValidationRegex());
    }

    CustomAttributeDefinition toDefinition() {
        CustomAttributeDefinition definition = new CustomAttributeDefinition();
        definition.setAttributeKey(attributeKey);
        definition.setLabel(label);
        definition.setDataType(dataType);
        definition.setRequired(required);
        definition.setAppliesToProductType(appliesToProductType);
        definition.setValidationRegex(validationRegex);
        return definition;
    }
}
