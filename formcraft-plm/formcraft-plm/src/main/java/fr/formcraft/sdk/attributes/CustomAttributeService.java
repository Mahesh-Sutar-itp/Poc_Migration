package fr.formcraft.sdk.attributes;

import fr.formcraft.model.entity.CustomAttributeDefinition;
import fr.formcraft.model.entity.Product;

import java.util.List;

/**
 * Customization Gate 2 (BMIDE style): lets a client register custom attributes on
 * {@link Product} and have them enforced automatically, without a schema migration
 * or a core code change.
 */
public interface CustomAttributeService {

    List<CustomAttributeDefinition> listDefinitions();

    CustomAttributeDefinition defineAttribute(CustomAttributeDefinition definition);

    /**
     * Validates a product's {@code customAttributes} against every registered
     * definition applicable to its product type.
     *
     * @throws fr.formcraft.common.exception.FormCraftException if any definition is violated
     */
    void validate(Product product);
}
