from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, AdminOrPurchasing
from app.schemas.supplier import SupplierSchema, SupplierCreateRequest, SupplierUpdateRequest
from app.schemas.supplier_product import SupplierProductSchema, SupplierProductCreateRequest
from app.services import supplier_service

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("", response_model_exclude_none=True)
def list_suppliers(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    items, _ = supplier_service.find_all(db, offset=0, limit=10000)
    return [SupplierSchema.model_validate(s, from_attributes=True) for s in items]


@router.get("/for-product/{product_id}", response_model_exclude_none=True)
def suppliers_for_product(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [SupplierProductSchema.model_validate(sp, from_attributes=True) for sp in supplier_service.get_suppliers_for_product(db, product_id)]


@router.get("/{supplier_id}", response_model_exclude_none=True)
def get_supplier(supplier_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return SupplierSchema.model_validate(supplier_service.get_by_id(db, supplier_id), from_attributes=True)


@router.post("", status_code=201, response_model_exclude_none=True)
def create_supplier(body: SupplierCreateRequest, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    from app.models.supplier import Supplier
    s = Supplier()
    s.code = body.code; s.name = body.name; s.contact_name = body.contactName
    s.contact_email = body.contactEmail; s.phone = body.phone; s.address = body.address; s.rating = body.rating
    return SupplierSchema.model_validate(supplier_service.create_supplier(db, s), from_attributes=True)


@router.put("/{supplier_id}", response_model_exclude_none=True)
def update_supplier(supplier_id: int, body: SupplierUpdateRequest, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    return SupplierSchema.model_validate(supplier_service.update_supplier(
        db, supplier_id, name=body.name, contact_name=body.contactName, contact_email=body.contactEmail,
        phone=body.phone, address=body.address, rating=body.rating, active=body.active), from_attributes=True)


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    supplier_service.delete_supplier(db, supplier_id)


@router.get("/{supplier_id}/products", response_model_exclude_none=True)
def supplier_products(supplier_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [SupplierProductSchema.model_validate(sp, from_attributes=True) for sp in supplier_service.get_products_for_supplier(db, supplier_id)]


@router.post("/{supplier_id}/products", status_code=201, response_model_exclude_none=True)
def link_product(supplier_id: int, body: SupplierProductCreateRequest, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    sp = supplier_service.link_product(db, supplier_id, body.productId, body.pricePerKg, body.leadTimeDays, body.moq, body.preferred)
    return SupplierProductSchema.model_validate(sp, from_attributes=True)


@router.delete("/{supplier_id}/products/{product_id}", status_code=204)
def unlink_product(supplier_id: int, product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    supplier_service.unlink_product(db, supplier_id, product_id)
