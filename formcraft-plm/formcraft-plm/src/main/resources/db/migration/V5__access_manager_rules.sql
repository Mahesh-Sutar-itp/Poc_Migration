-- ============================================================
-- V5: Customization Gate 4 (Access Manager-style) — declarative
--     role/action ACL rules layered on top of SecurityConfig's
--     static matcher chain via a custom PermissionEvaluator.
-- ============================================================

CREATE TABLE access_rules (
    id           BIGSERIAL PRIMARY KEY,
    role         VARCHAR(30) NOT NULL,
    action_key   VARCHAR(100) NOT NULL,
    effect       VARCHAR(10) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (role, action_key)
);
