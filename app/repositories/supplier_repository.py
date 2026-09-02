from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.supplier import Supplier


def find_by_id(db: Session, supplier_id: int) -> Supplier | None:
    return db.get(Supplier, supplier_id)


def find_by_code(db: Session, code: str) -> Supplier | None:
    return db.execute(select(Supplier).where(Supplier.code == code)).scalar_one_or_none()


def exists_by_code(db: Session, code: str) -> bool:
    return db.execute(select(Supplier.id).where(Supplier.code == code).limit(1)).first() is not None


def find_all(db: Session, offset: int = 0, limit: int = 20) -> list[Supplier]:
    return list(
        db.execute(select(Supplier).order_by(Supplier.id).offset(offset).limit(limit)).scalars().all()
    )


def count_all(db: Session) -> int:
    return db.execute(select(func.count(Supplier.id))).scalar_one()


def save(db: Session, supplier: Supplier) -> Supplier:
    db.add(supplier)
    db.flush()
    db.refresh(supplier)
    return supplier


def delete(db: Session, supplier: Supplier) -> None:
    db.delete(supplier)
    db.flush()
