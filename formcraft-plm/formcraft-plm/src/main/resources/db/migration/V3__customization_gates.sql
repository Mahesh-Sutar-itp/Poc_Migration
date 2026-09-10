-- ============================================================
-- FormCraft PLM - Database Schema
-- V3: Customization Gate 2 (BMIDE-style) — client-defined
--     attributes on Product, enforced without a schema migration.
--     (Gate 1, the ChangeRequest workflow rule handler, is pure
--     Java/Spring wiring and needs no schema change.)
-- ============================================================

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
