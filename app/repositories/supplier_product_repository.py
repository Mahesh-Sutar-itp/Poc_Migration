from sqlalchemy import delete as sa_delete
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.supplier_product import SupplierProduct


def find_by_product_id(db: Session, product_id: int) -> list[SupplierProduct]:
    return list(
        db.execute(
            select(SupplierProduct)
            .options(joinedload(SupplierProduct.supplier))
            .where(SupplierProduct.product_id == product_id)
        ).scalars().unique().all()
    )


def find_by_supplier_id(db: Session, supplier_id: int) -> list[SupplierProduct]:
    return list(
        db.execute(
            select(SupplierProduct)
            .options(joinedload(SupplierProduct.product))
            .where(SupplierProduct.supplier_id == supplier_id)
        ).scalars().unique().all()
    )


def delete_by_supplier_and_product(db: Session, supplier_id: int, product_id: int) -> int:
    result = db.execute(
        sa_delete(SupplierProduct).where(
            SupplierProduct.supplier_id == supplier_id, SupplierProduct.product_id == product_id
        )
    )
    return result.rowcount


def save(db: Session, sp: SupplierProduct) -> SupplierProduct:
    db.add(sp)
    db.flush()
    db.refresh(sp)
    return sp
