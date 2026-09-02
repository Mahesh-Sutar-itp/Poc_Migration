from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.change_request import ChangeRequest


def find_by_id(db: Session, cr_id: int) -> ChangeRequest | None:
    return db.get(ChangeRequest, cr_id)


def find_all(db: Session, offset: int = 0, limit: int = 20) -> list[ChangeRequest]:
    return list(
        db.execute(
            select(ChangeRequest).options(joinedload(ChangeRequest.product))
            .order_by(ChangeRequest.requested_at.desc()).offset(offset).limit(limit)
        ).scalars().unique().all()
    )


def count_all(db: Session) -> int:
    return db.execute(select(func.count(ChangeRequest.id))).scalar_one()


def find_by_product_id(db: Session, product_id: int) -> list[ChangeRequest]:
    return list(
        db.execute(
            select(ChangeRequest).where(ChangeRequest.product_id == product_id)
        ).scalars().all()
    )


def find_by_status(db: Session, status: str) -> list[ChangeRequest]:
    return list(
        db.execute(
            select(ChangeRequest).where(ChangeRequest.status == status)
        ).scalars().all()
    )


def count_by_status(db: Session, status: str) -> int:
    return db.execute(
        select(func.count(ChangeRequest.id)).where(ChangeRequest.status == status)
    ).scalar_one()


def save(db: Session, cr: ChangeRequest) -> ChangeRequest:
    db.add(cr)
    db.flush()
    db.refresh(cr)
    return cr
