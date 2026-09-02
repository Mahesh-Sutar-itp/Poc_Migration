-- ============================================================
-- FormCraft PLM - Database Schema
-- V1: Initial Schema
-- ============================================================

-- Products table (core entity)
CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    product_type    VARCHAR(30) NOT NULL,
    state           VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    unit            VARCHAR(20),
    cost_per_kg     NUMERIC(12, 4),
    formula_expression TEXT,
    allergen_flags  TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    version         BIGINT DEFAULT 0
);

-- Composition lines (BOM: product -> ingredient with quantity)
CREATE TABLE composition_lines (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id   BIGINT NOT NULL REFERENCES products(id),
    quantity        NUMERIC(12, 4) NOT NULL,
    percentage      NUMERIC(6, 4),
    unit            VARCHAR(20),
    is_allergen     BOOLEAN DEFAULT FALSE,
    position        INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Nutrient values per ingredient (per 100g)
CREATE TABLE nutrient_values (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    nutrient_type   VARCHAR(30) NOT NULL,
    value_per_100g  NUMERIC(10, 4) NOT NULL,
    unit            VARCHAR(10) DEFAULT 'g',
    UNIQUE(product_id, nutrient_type)
);

-- Formulation results (computed nutrition facts per product)
CREATE TABLE formulation_results (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    chain_id        VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    computed_values JSONB,
    nutri_score     VARCHAR(5),
    eco_score       VARCHAR(5),
    total_cost      NUMERIC(12, 4),
    errors          TEXT,
    warnings        TEXT,
    formulated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workflow tasks (assigned tasks per product)
CREATE TABLE workflow_tasks (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    task_name       VARCHAR(100) NOT NULL,
    description     TEXT,
    assignee        VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date        TIMESTAMP,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Quality checks
CREATE TABLE quality_checks (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    check_type      VARCHAR(50) NOT NULL,
    result          TEXT,
    status          VARCHAR(20) NOT NULL,
    checked_by      VARCHAR(100),
    checked_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    entity_id       BIGINT NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    action          VARCHAR(50) NOT NULL,
    performed_by    VARCHAR(100),
    details         TEXT,
    performed_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX idx_products_type       ON products(product_type);
CREATE INDEX idx_products_state      ON products(state);
CREATE INDEX idx_products_code       ON products(code);
CREATE INDEX idx_composition_product ON composition_lines(product_id);
CREATE INDEX idx_nutrient_product    ON nutrient_values(product_id);
CREATE INDEX idx_formulation_product ON formulation_results(product_id);
CREATE INDEX idx_workflow_product    ON workflow_tasks(product_id);
CREATE INDEX idx_audit_entity        ON audit_logs(entity_id, entity_type);

-- ── Seed Data ────────────────────────────────────────────────────────────

-- Raw materials (ingredients)
INSERT INTO products (code, name, description, product_type, state, unit, cost_per_kg, formula_expression) VALUES
('RM-001', 'Wheat Flour',       'High-gluten wheat flour',       'RAW_MATERIAL', 'VALIDATED', 'kg', 0.80,  NULL),
('RM-002', 'Cacao Powder',      'Dark cacao powder 70%',         'RAW_MATERIAL', 'VALIDATED', 'kg', 12.50, NULL),
('RM-003', 'Sugar',             'Refined white sugar',           'RAW_MATERIAL', 'VALIDATED', 'kg', 0.70,  NULL),
('RM-004', 'Butter',            'Unsalted butter 82% fat',       'RAW_MATERIAL', 'VALIDATED', 'kg', 7.20,  NULL),
('RM-005', 'Eggs',              'Free-range hen eggs',           'RAW_MATERIAL', 'VALIDATED', 'kg', 3.50,  NULL),
('RM-006', 'Milk Powder',       'Full-fat dry milk powder',      'RAW_MATERIAL', 'VALIDATED', 'kg', 5.60,  NULL),
('RM-007', 'Vanilla Extract',   'Pure vanilla extract',          'RAW_MATERIAL', 'VALIDATED', 'kg', 45.00, NULL),
('RM-008', 'Salt',              'Fine sea salt',                 'RAW_MATERIAL', 'VALIDATED', 'kg', 0.40,  NULL);

-- Nutrient values per raw material (per 100g)
INSERT INTO nutrient_values (product_id, nutrient_type, value_per_100g, unit) VALUES
-- Wheat Flour (RM-001, id=1)
(1, 'ENERGY_KCAL', 364.0, 'kcal'), (1, 'PROTEIN', 10.3, 'g'), (1, 'FAT', 1.0, 'g'),
(1, 'CARBOHYDRATES', 76.3, 'g'), (1, 'FIBER', 2.7, 'g'), (1, 'SALT', 0.002, 'g'),
-- Cacao Powder (RM-002, id=2)
(2, 'ENERGY_KCAL', 228.0, 'kcal'), (2, 'PROTEIN', 19.6, 'g'), (2, 'FAT', 13.7, 'g'),
(2, 'CARBOHYDRATES', 57.9, 'g'), (2, 'FIBER', 33.2, 'g'), (2, 'SALT', 0.021, 'g'),
-- Sugar (RM-003, id=3)
(3, 'ENERGY_KCAL', 387.0, 'kcal'), (3, 'PROTEIN', 0.0, 'g'), (3, 'FAT', 0.0, 'g'),
(3, 'CARBOHYDRATES', 99.8, 'g'), (3, 'FIBER', 0.0, 'g'), (3, 'SALT', 0.001, 'g'),
-- Butter (RM-004, id=4)
(4, 'ENERGY_KCAL', 717.0, 'kcal'), (4, 'PROTEIN', 0.9, 'g'), (4, 'FAT', 81.1, 'g'),
(4, 'CARBOHYDRATES', 0.1, 'g'), (4, 'FIBER', 0.0, 'g'), (4, 'SALT', 0.011, 'g'),
-- Eggs (RM-005, id=5)
(5, 'ENERGY_KCAL', 143.0, 'kcal'), (5, 'PROTEIN', 12.6, 'g'), (5, 'FAT', 9.5, 'g'),
(5, 'CARBOHYDRATES', 0.7, 'g'), (5, 'FIBER', 0.0, 'g'), (5, 'SALT', 0.37, 'g'),
-- Milk Powder (RM-006, id=6)
(6, 'ENERGY_KCAL', 496.0, 'kcal'), (6, 'PROTEIN', 26.3, 'g'), (6, 'FAT', 26.7, 'g'),
(6, 'CARBOHYDRATES', 38.4, 'g'), (6, 'FIBER', 0.0, 'g'), (6, 'SALT', 0.40, 'g'),
-- Vanilla Extract (RM-007, id=7)
(7, 'ENERGY_KCAL', 288.0, 'kcal'), (7, 'PROTEIN', 0.1, 'g'), (7, 'FAT', 0.1, 'g'),
(7, 'CARBOHYDRATES', 12.7, 'g'), (7, 'FIBER', 0.0, 'g'), (7, 'SALT', 0.010, 'g'),
-- Salt (RM-008, id=8)
(8, 'ENERGY_KCAL', 0.0, 'kcal'), (8, 'PROTEIN', 0.0, 'g'), (8, 'FAT', 0.0, 'g'),
(8, 'CARBOHYDRATES', 0.0, 'g'), (8, 'FIBER', 0.0, 'g'), (8, 'SALT', 39.3, 'g');

-- Finished product (Chocolate Brownie)
INSERT INTO products (code, name, description, product_type, state, unit, cost_per_kg,
    formula_expression, allergen_flags) VALUES
('FP-001', 'Chocolate Brownie', 'Rich dark chocolate brownie with cacao and butter',
    'FINISHED_PRODUCT', 'DRAFT', 'kg', NULL,
    'protein * 4 + fat * 9 + carbohydrates * 4',
    'GLUTEN,EGGS,MILK');

-- Composition of Chocolate Brownie (FP-001, id=9)
INSERT INTO composition_lines (product_id, ingredient_id, quantity, unit, position) VALUES
(9, 1, 25.0, '%', 1),  -- Wheat Flour 25%
(9, 2, 20.0, '%', 2),  -- Cacao Powder 20%
(9, 3, 30.0, '%', 3),  -- Sugar 30%
(9, 4, 15.0, '%', 4),  -- Butter 15%
(9, 5, 8.0,  '%', 5),  -- Eggs 8%
(9, 8, 2.0,  '%', 6);  -- Salt 2%

-- Semi-finished product (Chocolate Ganache)
INSERT INTO products (code, name, description, product_type, state, unit, cost_per_kg,
    formula_expression, allergen_flags) VALUES
('SF-001', 'Chocolate Ganache', 'Dark chocolate ganache for coating',
    'SEMI_FINISHED', 'DRAFT', 'kg', NULL,
    'protein * 4 + fat * 9 + carbohydrates * 4',
    'MILK');

INSERT INTO composition_lines (product_id, ingredient_id, quantity, unit, position) VALUES
(10, 2, 50.0, '%', 1),  -- Cacao Powder 50%
(10, 4, 30.0, '%', 2),  -- Butter 30%
(10, 6, 20.0, '%', 3);  -- Milk Powder 20%
