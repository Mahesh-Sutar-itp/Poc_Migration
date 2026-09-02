import logging
from threading import Thread

from sqlalchemy.orm import Session

from app.core.constants import (
    AUDIT_CREATE, AUDIT_DELETE, AUDIT_FORMULATE, AUDIT_QUALITY_CHECK,
    AUDIT_TRANSITION, AUDIT_UPDATE,
)
from app.core.database import SessionLocal
from app.models.audit_log import AuditLog
from app.repositories import audit_log_repository

logger = logging.getLogger(__name__)

PRODUCT_TYPE = "Product"


def _write_log_in_new_session(entity_id: int, entity_type: str, action: str, details: str | None, performed_by: str | None):
    """Write an audit log entry in a separate session (mirrors @Async + REQUIRES_NEW)."""
    try:
        db = SessionLocal()
        try:
            log = AuditLog()
            log.entity_id = entity_id
            log.entity_type = entity_type
            log.action = action
            log.performed_by = performed_by or "system"
            log.details = details
            audit_log_repository.save(db, log)
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to write audit log for entityId={entity_id}: {e}")


def _fire_and_forget(entity_id: int, entity_type: str, action: str, details: str | None, performed_by: str | None = None):
    t = Thread(target=_write_log_in_new_session, args=(entity_id, entity_type, action, details, performed_by), daemon=True)
    t.start()


def log_create(entity_id: int, details: str, performed_by: str | None = None):
    _fire_and_forget(entity_id, PRODUCT_TYPE, AUDIT_CREATE, details, performed_by)


def log_update(entity_id: int, details: str, performed_by: str | None = None):
    _fire_and_forget(entity_id, PRODUCT_TYPE, AUDIT_UPDATE, details, performed_by)


def log_formulation(product_id: int, chain_id: str, status: str, performed_by: str | None = None):
    _fire_and_forget(product_id, PRODUCT_TYPE, AUDIT_FORMULATE, f"chainId={chain_id} status={status}", performed_by)


def log_workflow_transition(product_id: int, from_state: str, to_state: str, performed_by: str | None = None):
    _fire_and_forget(product_id, PRODUCT_TYPE, AUDIT_TRANSITION, f"{from_state} -> {to_state}", performed_by)


def log_action(entity_id: int, entity_type: str, action: str, details: str, performed_by: str | None = None):
    _fire_and_forget(entity_id, entity_type, action, details, performed_by)


def get_product_history(db: Session, product_id: int) -> list[AuditLog]:
    return audit_log_repository.find_by_entity(db, product_id, PRODUCT_TYPE)


def get_history(db: Session, entity_id: int, entity_type: str) -> list[AuditLog]:
    return audit_log_repository.find_by_entity(db, entity_id, entity_type)


def get_recent_activity(db: Session, limit: int = 20) -> list[AuditLog]:
    return audit_log_repository.find_all_ordered(db, offset=0, limit=limit)
