from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.models.supplier import Supplier
from app.models.supplier_product import SupplierProduct
from app.repositories import product_repository, supplier_product_repository, supplier_repository


def find_all(db: Session, offset: int = 0, limit: int = 20) -> tuple[list[Supplier], int]:
    items = supplier_repository.find_all(db, offset=offset, limit=limit)
    total = supplier_repository.count_all(db)
    return items, total


def get_by_id(db: Session, supplier_id: int) -> Supplier:
    s = supplier_repository.find_by_id(db, supplier_id)
    if not s:
        raise EntityNotFoundException("Supplier", supplier_id)
    return s


def create_supplier(db: Session, supplier: Supplier) -> Supplier:
    if supplier_repository.exists_by_code(db, supplier.code):
        raise FormCraftException(f"Supplier with code '{supplier.code}' already exists")
    supplier.active = True
    saved = supplier_repository.save(db, supplier)
    db.commit()
    return saved


def update_supplier(db: Session, supplier_id: int, name: str | None = None, contact_name: str | None = None,
                    contact_email: str | None = None, phone: str | None = None, address: str | None = None,
                    rating: int | None = None, active: bool | None = None) -> Supplier:
    existing = get_by_id(db, supplier_id)
    if name is not None: existing.name = name
    if contact_name is not None: existing.contact_name = contact_name
    if contact_email is not None: existing.contact_email = contact_email
    if phone is not None: existing.phone = phone
    if address is not None: existing.address = address
    if rating is not None: existing.rating = rating
    if active is not None: existing.active = active
    saved = supplier_repository.save(db, existing)
    db.commit()
    return saved


def delete_supplier(db: Session, supplier_id: int) -> None:
    supplier = get_by_id(db, supplier_id)
    supplier_repository.delete(db, supplier)
    db.commit()


def link_product(db: Session, supplier_id: int, product_id: int, price_per_kg: float | None,
                 lead_time_days: int | None, moq: float | None, preferred: bool) -> SupplierProduct:
    supplier = get_by_id(db, supplier_id)
    product = product_repository.find_by_id(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)
    sp = SupplierProduct()
    sp.supplier_id = supplier_id
    sp.supplier = supplier
    sp.product_id = product_id
    sp.product = product
    sp.price_per_kg = Decimal(str(price_per_kg)) if price_per_kg is not None else None
    sp.lead_time_days = lead_time_days
    sp.moq = Decimal(str(moq)) if moq is not None else None
    sp.preferred = preferred
    saved = supplier_product_repository.save(db, sp)
    db.commit()
    return saved


def unlink_product(db: Session, supplier_id: int, product_id: int) -> None:
    supplier_product_repository.delete_by_supplier_and_product(db, supplier_id, product_id)
    db.commit()


def get_products_for_supplier(db: Session, supplier_id: int) -> list[SupplierProduct]:
    return supplier_product_repository.find_by_supplier_id(db, supplier_id)


def get_suppliers_for_product(db: Session, product_id: int) -> list[SupplierProduct]:
    return supplier_product_repository.find_by_product_id(db, product_id)
