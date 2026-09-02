from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.corrective_action import CorrectiveAction


def find_by_id(db: Session, ca_id: int) -> CorrectiveAction | None:
    return db.get(CorrectiveAction, ca_id)


def find_by_non_conformance_id(db: Session, nc_id: int) -> list[CorrectiveAction]:
    return list(
        db.execute(
            select(CorrectiveAction).where(CorrectiveAction.non_conformance_id == nc_id)
        ).scalars().all()
    )


def count_by_nc_and_status(db: Session, nc_id: int, status: str) -> int:
    return db.execute(
        select(func.count(CorrectiveAction.id)).where(
            CorrectiveAction.non_conformance_id == nc_id, CorrectiveAction.status == status
        )
    ).scalar_one()


def count_by_status(db: Session, status: str) -> int:
    return db.execute(
        select(func.count(CorrectiveAction.id)).where(CorrectiveAction.status == status)
    ).scalar_one()


def save(db: Session, ca: CorrectiveAction) -> CorrectiveAction:
    db.add(ca)
    db.flush()
    db.refresh(ca)
    return ca
