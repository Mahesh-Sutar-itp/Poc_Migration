-- ============================================================
-- FormCraft PLM - Database Schema
-- V2: Full PLM module expansion
--   Users & Roles, Suppliers, Specifications, Non-Conformance/CAPA,
--   Change Requests, Projects, Documents, Inventory, Notifications
-- ============================================================

-- ── Users & Roles ───────────────────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150),
    email           VARCHAR(150),
    role            VARCHAR(30) NOT NULL,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Suppliers & Sourcing ─────────────────────────────────────────────────────
CREATE TABLE suppliers (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    contact_name    VARCHAR(150),
    contact_email   VARCHAR(150),
    phone           VARCHAR(50),
    address         TEXT,
    rating          INTEGER,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE supplier_products (
    id              BIGSERIAL PRIMARY KEY,
    supplier_id     BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_per_kg    NUMERIC(12, 4),
    lead_time_days  INTEGER,
    moq             NUMERIC(12, 4),
    preferred       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Specifications ───────────────────────────────────────────────────────────
CREATE TABLE specifications (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    parameter       VARCHAR(100) NOT NULL,
    spec_type       VARCHAR(30) NOT NULL,
    min_value       NUMERIC(12, 4),
    max_value       NUMERIC(12, 4),
    target_value    NUMERIC(12, 4),
    unit            VARCHAR(20),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100)
);

-- ── Non-Conformance & CAPA ───────────────────────────────────────────────────
CREATE TABLE non_conformances (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quality_check_id    BIGINT REFERENCES quality_checks(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    severity            VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    raised_by           VARCHAR(100),
    raised_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMP
);

CREATE TABLE corrective_actions (
    id                  BIGSERIAL PRIMARY KEY,
    non_conformance_id  BIGINT NOT NULL REFERENCES non_conformances(id) ON DELETE CASCADE,
    description         TEXT NOT NULL,
    owner               VARCHAR(100),
    due_date            DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMP
);

-- ── Change Management (ECR/ECO) ──────────────────────────────────────────────
CREATE TABLE change_requests (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    reason              TEXT,
    impact              TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    requested_by        VARCHAR(100),
    requested_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    decided_by          VARCHAR(100),
    decided_at          TIMESTAMP,
    decision_comment    TEXT
);

-- ── NPD Projects (stage-gate) ─────────────────────────────────────────────────
CREATE TABLE projects (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PLANNING',
    owner               VARCHAR(100),
    target_launch_date  DATE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_products (
    project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, product_id)
);

CREATE TABLE project_milestones (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    gate_number     INTEGER NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date        DATE,
    completed_at    TIMESTAMP
);

-- ── Document Management ──────────────────────────────────────────────────────
CREATE TABLE documents (
    id              BIGSERIAL PRIMARY KEY,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       BIGINT NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    content_type    VARCHAR(150),
    file_size       BIGINT,
    content         BYTEA,
    version         INTEGER NOT NULL DEFAULT 1,
    uploaded_by     VARCHAR(100),
    uploaded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Inventory / Lot Tracking ──────────────────────────────────────────────────
CREATE TABLE stock_lots (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_number          VARCHAR(100) NOT NULL,
    quantity_on_hand    NUMERIC(12, 4) NOT NULL,
    unit                VARCHAR(20),
    expiry_date         DATE,
    supplier_id         BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    received_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE stock_movements (
    id              BIGSERIAL PRIMARY KEY,
    stock_lot_id    BIGINT NOT NULL REFERENCES stock_lots(id) ON DELETE CASCADE,
    movement_type   VARCHAR(20) NOT NULL,
    quantity        NUMERIC(12, 4) NOT NULL,
    performed_by    VARCHAR(100),
    performed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    reference       VARCHAR(255)
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id                  BIGSERIAL PRIMARY KEY,
    recipient_username  VARCHAR(100) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    message             TEXT,
    link                VARCHAR(255),
    category            VARCHAR(30) NOT NULL,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product  ON supplier_products(product_id);
CREATE INDEX idx_specifications_product     ON specifications(product_id);
CREATE INDEX idx_nc_product                 ON non_conformances(product_id);
CREATE INDEX idx_nc_status                  ON non_conformances(status);
CREATE INDEX idx_capa_nc                    ON corrective_actions(non_conformance_id);
CREATE INDEX idx_cr_product                 ON change_requests(product_id);
CREATE INDEX idx_cr_status                  ON change_requests(status);
CREATE INDEX idx_milestones_project         ON project_milestones(project_id);
CREATE INDEX idx_documents_entity           ON documents(entity_type, entity_id);
CREATE INDEX idx_stock_lots_product         ON stock_lots(product_id);
CREATE INDEX idx_stock_movements_lot        ON stock_movements(stock_lot_id);
CREATE INDEX idx_notifications_recipient    ON notifications(recipient_username, is_read);

-- ── Seed Data ─────────────────────────────────────────────────────────────────

-- Users (password for all seeded accounts is "Passw0rd!" — bcrypt hash below)
-- Hash verified against BCryptPasswordEncoder-compatible bcrypt for the literal string "Passw0rd!"
INSERT INTO users (username, password_hash, full_name, email, role) VALUES
('admin',      '$2b$10$15qZGfi/R2Wh/hy0Su3QRO7IPDcYQCIR2t3jgutIo/e3kbTnHWkFq', 'Alex Admin',       'admin@formcraft.local',      'ADMIN'),
('plmmanager', '$2b$10$15qZGfi/R2Wh/hy0Su3QRO7IPDcYQCIR2t3jgutIo/e3kbTnHWkFq', 'Priya Patel',      'plm@formcraft.local',        'PLM_MANAGER'),
('quality',    '$2b$10$15qZGfi/R2Wh/hy0Su3QRO7IPDcYQCIR2t3jgutIo/e3kbTnHWkFq', 'Quentin Reyes',    'quality@formcraft.local',    'QUALITY_MANAGER'),
('purchasing', '$2b$10$15qZGfi/R2Wh/hy0Su3QRO7IPDcYQCIR2t3jgutIo/e3kbTnHWkFq', 'Paula Chen',       'purchasing@formcraft.local', 'PURCHASING'),
('viewer',     '$2b$10$15qZGfi/R2Wh/hy0Su3QRO7IPDcYQCIR2t3jgutIo/e3kbTnHWkFq', 'Victor Lopez',     'viewer@formcraft.local',     'VIEWER');

-- Suppliers
INSERT INTO suppliers (code, name, contact_name, contact_email, phone, address, rating) VALUES
('SUP-001', 'Golden Fields Milling',  'Maria Santos',   'sales@goldenfields.example',  '+1-555-0101', '100 Grain Rd, Wheatville',   5),
('SUP-002', 'Cacao Traders Co.',      'Jean Dubois',     'orders@cacaotraders.example', '+1-555-0102', '22 Cocoa Ave, Portville',    4),
('SUP-003', 'Dairy Fresh Ltd.',       'Emma Wilson',     'contact@dairyfresh.example',  '+1-555-0103', '7 Pasture Ln, Milltown',     4);

-- Supplier -> raw material links
INSERT INTO supplier_products (supplier_id, product_id, price_per_kg, lead_time_days, moq, preferred) VALUES
(1, 1, 0.78, 5, 500,  TRUE),   -- Golden Fields -> Wheat Flour
(2, 2, 12.20, 10, 100, TRUE),  -- Cacao Traders -> Cacao Powder
(3, 4, 7.00, 3, 200,  TRUE),   -- Dairy Fresh -> Butter
(3, 6, 5.40, 3, 200,  TRUE);   -- Dairy Fresh -> Milk Powder

-- Specifications for the Chocolate Brownie finished product (id=9)
INSERT INTO specifications (product_id, parameter, spec_type, min_value, max_value, target_value, unit, created_by) VALUES
(9, 'Moisture Content',  'PHYSICAL',        8.0,  12.0, 10.0, '%',   'system'),
(9, 'pH',                'CHEMICAL',        5.5,  6.5,  6.0,  'pH',  'system'),
(9, 'Total Plate Count', 'MICROBIOLOGICAL', NULL, 1000, NULL, 'CFU/g', 'system'),
(9, 'Energy',            'NUTRITIONAL',     NULL, 450,  NULL, 'kcal', 'system');

-- A sample NPD project referencing the finished + semi-finished products
INSERT INTO projects (name, description, status, owner, target_launch_date) VALUES
('Chocolate Brownie Range Launch', 'New chocolate brownie line development and market launch', 'IN_PROGRESS', 'plmmanager', CURRENT_DATE + INTERVAL '90 days');

INSERT INTO project_products (project_id, product_id) VALUES (1, 9), (1, 10);

INSERT INTO project_milestones (project_id, name, gate_number, status, due_date, completed_at) VALUES
(1, 'Gate 1: Concept & Feasibility', 1, 'DONE',        CURRENT_DATE - INTERVAL '30 days', NOW() - INTERVAL '28 days'),
(1, 'Gate 2: Formulation & Costing', 2, 'IN_PROGRESS', CURRENT_DATE + INTERVAL '10 days', NULL),
(1, 'Gate 3: Quality Validation',    3, 'PENDING',     CURRENT_DATE + INTERVAL '45 days', NULL),
(1, 'Gate 4: Launch Readiness',      4, 'PENDING',     CURRENT_DATE + INTERVAL '90 days', NULL);

-- A sample stock lot per raw material used in the seed BOMs
INSERT INTO stock_lots (product_id, lot_number, quantity_on_hand, unit, expiry_date, supplier_id, status) VALUES
(1, 'LOT-WF-2026-01', 850.0,  'kg', CURRENT_DATE + INTERVAL '180 days', 1, 'ACTIVE'),
(2, 'LOT-CP-2026-01', 45.0,   'kg', CURRENT_DATE + INTERVAL '365 days', 2, 'ACTIVE'),
(3, 'LOT-SG-2026-01', 600.0,  'kg', CURRENT_DATE + INTERVAL '720 days', NULL, 'ACTIVE'),
(4, 'LOT-BT-2026-01', 18.0,   'kg', CURRENT_DATE + INTERVAL '60 days', 3, 'ACTIVE'),
(6, 'LOT-MP-2026-01', 22.0,   'kg', CURRENT_DATE + INTERVAL '300 days', 3, 'ACTIVE');

INSERT INTO stock_movements (stock_lot_id, movement_type, quantity, performed_by, reference) VALUES
(1, 'RECEIVE', 850.0, 'purchasing', 'Initial receipt'),
(2, 'RECEIVE', 45.0,  'purchasing', 'Initial receipt'),
(3, 'RECEIVE', 600.0, 'purchasing', 'Initial receipt'),
(4, 'RECEIVE', 18.0,  'purchasing', 'Initial receipt'),
(5, 'RECEIVE', 22.0,  'purchasing', 'Initial receipt');

-- A welcome notification per seeded user
INSERT INTO notifications (recipient_username, title, message, category) VALUES
('admin',      'Welcome to FormCraft PLM', 'Your administrator account is set up.', 'SYSTEM'),
('plmmanager', 'Welcome to FormCraft PLM', 'You have been assigned as owner of the Chocolate Brownie Range Launch project.', 'SYSTEM'),
('quality',    'Welcome to FormCraft PLM', 'Specifications have been defined for Chocolate Brownie.', 'SYSTEM'),
('purchasing', 'Welcome to FormCraft PLM', 'Initial stock lots have been received for all raw materials.', 'SYSTEM');
