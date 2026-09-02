from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.specification import Specification


def find_by_id(db: Session, spec_id: int) -> Specification | None:
    return db.get(Specification, spec_id)


def find_by_product_id(db: Session, product_id: int) -> list[Specification]:
    return list(
        db.execute(
            select(Specification).where(Specification.product_id == product_id)
        ).scalars().all()
    )


def save(db: Session, spec: Specification) -> Specification:
    db.add(spec)
    db.flush()
    db.refresh(spec)
    return spec


def delete(db: Session, spec: Specification) -> None:
    db.delete(spec)
    db.flush()
