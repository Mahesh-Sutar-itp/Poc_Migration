from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.quality_check import QualityCheck


def find_by_id(db: Session, qc_id: int) -> QualityCheck | None:
    return db.get(QualityCheck, qc_id)


def find_by_product_id(db: Session, product_id: int) -> list[QualityCheck]:
    return list(
        db.execute(
            select(QualityCheck).where(QualityCheck.product_id == product_id)
        ).scalars().all()
    )


def count_by_status(db: Session, status: str) -> int:
    return db.execute(
        select(func.count(QualityCheck.id)).where(QualityCheck.status == status)
    ).scalar_one()


def save(db: Session, qc: QualityCheck) -> QualityCheck:
    db.add(qc)
    db.flush()
    db.refresh(qc)
    return qc
