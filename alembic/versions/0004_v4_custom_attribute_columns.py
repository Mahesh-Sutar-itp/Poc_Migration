"""V4 custom attributes become real columns

Customization Gate 2 stops storing client-defined attributes in products.custom_attributes
(JSONB) and gives each one a typed column instead, named x_<attribute_key>. Existing values
are copied across before the JSON column is dropped.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-18 00:00:00.000000
"""
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

_UPGRADE_SQL = """
ALTER TABLE product_attribute_definitions ADD COLUMN IF NOT EXISTS column_name VARCHAR(63);

DO $$
DECLARE
    definition RECORD;
    col_name   TEXT;
    col_type   TEXT;
BEGIN
    FOR definition IN SELECT attribute_key, data_type FROM product_attribute_definitions LOOP
        col_name := 'x_' || definition.attribute_key;
        col_type := CASE definition.data_type
                        WHEN 'NUMBER'  THEN 'NUMERIC(18,6)'
                        WHEN 'BOOLEAN' THEN 'BOOLEAN'
                        WHEN 'DATE'    THEN 'DATE'
                        ELSE 'VARCHAR(255)'
                    END;

        EXECUTE format('ALTER TABLE products ADD COLUMN IF NOT EXISTS %I %s', col_name, col_type);
        EXECUTE format(
            'UPDATE products SET %I = NULLIF(custom_attributes->>%L, '''')::%s WHERE custom_attributes ? %L',
            col_name, definition.attribute_key, col_type, definition.attribute_key
        );
        EXECUTE format(
            'UPDATE product_attribute_definitions SET column_name = %L WHERE attribute_key = %L',
            col_name, definition.attribute_key
        );
    END LOOP;
END $$;

ALTER TABLE products DROP COLUMN IF EXISTS custom_attributes;
"""

# Values already migrated into typed columns are copied back into the JSON document, so a
# downgrade loses the columns but not the data.
_DOWNGRADE_SQL = """
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
DECLARE
    definition RECORD;
    col_name   TEXT;
BEGIN
    FOR definition IN SELECT attribute_key FROM product_attribute_definitions LOOP
        col_name := 'x_' || definition.attribute_key;
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = col_name) THEN
            EXECUTE format(
                'UPDATE products SET custom_attributes = custom_attributes || jsonb_build_object(%L, %I) '
                'WHERE %I IS NOT NULL',
                definition.attribute_key, col_name, col_name
            );
            EXECUTE format('ALTER TABLE products DROP COLUMN %I', col_name);
        END IF;
    END LOOP;
END $$;

ALTER TABLE product_attribute_definitions DROP COLUMN IF EXISTS column_name;
"""


def upgrade() -> None:
    op.execute(_UPGRADE_SQL)


def downgrade() -> None:
    op.execute(_DOWNGRADE_SQL)
