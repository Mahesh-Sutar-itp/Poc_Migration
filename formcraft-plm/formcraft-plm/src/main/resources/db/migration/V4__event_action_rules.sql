-- ============================================================
-- V4: Customization Gate 3 (Event Manager-style) — DB-backed
--     event -> action bindings, replacing the hardcoded
--     notification calls at ChangeRequest/NonConformance/Inventory
--     call sites. Seeded rows below reproduce today's exact
--     hardcoded behavior.
-- ============================================================

CREATE TABLE event_action_rules (
    id                      BIGSERIAL PRIMARY KEY,
    event_type              VARCHAR(40) NOT NULL,
    condition_product_type  VARCHAR(30),
    action_type             VARCHAR(30) NOT NULL,
    target_role             VARCHAR(30),
    notification_title      VARCHAR(150) NOT NULL,
    message_template        VARCHAR(500) NOT NULL,
    notification_category   VARCHAR(20) NOT NULL,
    enabled                 BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO event_action_rules (event_type, action_type, target_role, notification_title, message_template, notification_category) VALUES
('CHANGE_REQUEST_SUBMITTED','NOTIFY_ROLE','PLM_MANAGER','Change request awaiting review','"{title}" is ready for your review.','CHANGE_REQUEST'),
('CHANGE_REQUEST_APPROVED','NOTIFY_INITIATING_USER',NULL,'Change request approved','"{title}" was approved.','CHANGE_REQUEST'),
('CHANGE_REQUEST_REJECTED','NOTIFY_INITIATING_USER',NULL,'Change request rejected','"{title}" was rejected.','CHANGE_REQUEST'),
('NON_CONFORMANCE_OPENED','NOTIFY_ROLE','QUALITY_MANAGER','Non-conformance raised','"{title}" raised against {detail}.','QUALITY'),
('INVENTORY_LOW_STOCK','NOTIFY_ROLE','PURCHASING','Low stock alert','{title} is low: {detail}.','INVENTORY');
