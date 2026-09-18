"""V3 customization gates

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-11 00:00:00.000000
"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

# Customization Gate 2 (BMIDE-style) — client-defined attributes on Product,
# enforced without a schema migration. (Gate 1, the ChangeRequest workflow rule
# handler, is pure Python/FastAPI wiring and needs no schema change.)
_UPGRADE_SQL = """
ALTER TABLE products
    ADD COLUMN custom_attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE product_attribute_definitions (
    id                       BIGSERIAL PRIMARY KEY,
    attribute_key            VARCHAR(100) NOT NULL UNIQUE,
    label                    VARCHAR(150) NOT NULL,
    data_type                VARCHAR(20) NOT NULL,
    required                 BOOLEAN NOT NULL DEFAULT FALSE,
    applies_to_product_type  VARCHAR(30),
    validation_regex         VARCHAR(255),
    created_at               TIMESTAMP NOT NULL DEFAULT NOW()
);
"""


def upgrade() -> None:
    op.execute(_UPGRADE_SQL)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS product_attribute_definitions CASCADE")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS custom_attributes")
