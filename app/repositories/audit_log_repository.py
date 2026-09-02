from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def find_by_entity(db: Session, entity_id: int, entity_type: str) -> list[AuditLog]:
    return list(
        db.execute(
            select(AuditLog)
            .where(AuditLog.entity_id == entity_id, AuditLog.entity_type == entity_type)
            .order_by(AuditLog.performed_at.desc())
        ).scalars().all()
    )


def find_all_ordered(db: Session, offset: int = 0, limit: int = 20) -> list[AuditLog]:
    return list(
        db.execute(
            select(AuditLog).order_by(AuditLog.performed_at.desc()).offset(offset).limit(limit)
        ).scalars().all()
    )


def count_all(db: Session) -> int:
    from sqlalchemy import func
    return db.execute(select(func.count(AuditLog.id))).scalar_one()


def save(db: Session, audit_log: AuditLog) -> AuditLog:
    db.add(audit_log)
    db.flush()
    return audit_log
