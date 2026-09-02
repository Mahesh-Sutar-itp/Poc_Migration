from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.non_conformance import NonConformance


def find_by_id(db: Session, nc_id: int) -> NonConformance | None:
    return db.get(NonConformance, nc_id)


def find_all(db: Session, offset: int = 0, limit: int = 20) -> list[NonConformance]:
    return list(
        db.execute(
            select(NonConformance).options(joinedload(NonConformance.product))
            .order_by(NonConformance.raised_at.desc()).offset(offset).limit(limit)
        ).scalars().unique().all()
    )


def count_all(db: Session) -> int:
    return db.execute(select(func.count(NonConformance.id))).scalar_one()


def find_by_product_id(db: Session, product_id: int) -> list[NonConformance]:
    return list(
        db.execute(
            select(NonConformance).where(NonConformance.product_id == product_id)
        ).scalars().all()
    )


def find_by_status(db: Session, status: str) -> list[NonConformance]:
    return list(
        db.execute(
            select(NonConformance).where(NonConformance.status == status)
        ).scalars().all()
    )


def count_by_status(db: Session, status: str) -> int:
    return db.execute(
        select(func.count(NonConformance.id)).where(NonConformance.status == status)
    ).scalar_one()


def save(db: Session, nc: NonConformance) -> NonConformance:
    db.add(nc)
    db.flush()
    db.refresh(nc)
    return nc
