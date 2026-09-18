package fr.formcraft.repo.attributes.impl;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.CustomAttributeDefinition;
import fr.formcraft.model.enums.CustomAttributeType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Materializes a Gate 2 custom attribute as a real column on {@code products}, via
 * dynamic DDL driven entirely by the attribute's declared type — core never has a
 * client-specific column name or type baked in.
 */
@Component
public class ProductAttributeColumnManager {

    private static final Pattern SAFE_COLUMN_NAME = Pattern.compile("^[a-z][a-z0-9_]{0,99}$");

    private final JdbcTemplate jdbcTemplate;

    public ProductAttributeColumnManager(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Adds a column for {@code definition.getAttributeKey()} to {@code products} if one
     * doesn't already exist. Idempotent, so redefining or re-seeding is always safe.
     */
    public void ensureColumn(CustomAttributeDefinition definition) {
        String columnName = definition.getAttributeKey();
        if (!SAFE_COLUMN_NAME.matcher(columnName).matches()) {
            throw new FormCraftException(
                    "Attribute key '" + columnName + "' must be lowercase letters, digits and underscores, "
                            + "starting with a letter, to be usable as a database column name");
        }

        String sqlType = sqlTypeFor(definition.getDataType());
        jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS \"" + columnName + "\" " + sqlType);
    }

    private String sqlTypeFor(CustomAttributeType dataType) {
        return switch (dataType) {
            case STRING -> "VARCHAR(255)";
            case NUMBER -> "NUMERIC";
            case BOOLEAN -> "BOOLEAN";
            case DATE -> "DATE";
        };
    }
}
