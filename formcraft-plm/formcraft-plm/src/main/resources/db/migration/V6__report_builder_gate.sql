-- ============================================================
-- V6: Customization Gate 5 (RAC Report Builder-style) — DB-backed
--     report templates completing the field-projection layer that
--     RepoConsts.REPORT_* constants hinted at but never wired up.
-- ============================================================

CREATE TABLE report_templates (
    id              BIGSERIAL PRIMARY KEY,
    template_key    VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    target_entity   VARCHAR(30)  NOT NULL,
    fields          JSONB NOT NULL DEFAULT '[]'::jsonb,
    labels          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO report_templates (template_key, name, target_entity, fields, labels) VALUES
('PRODUCT_SHEET', 'Product Sheet', 'PRODUCT', '["code","name","productType","costPerKg"]', '{"code":"Code","name":"Name","productType":"Type","costPerKg":"Cost/kg"}'),
('ALLERGEN_SUMMARY', 'Allergen Summary', 'PRODUCT', '["code","name","allergenFlags"]', '{"code":"Code","name":"Name","allergenFlags":"Allergens"}');
