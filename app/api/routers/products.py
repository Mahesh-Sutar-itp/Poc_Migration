import math
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.api.deps import CurrentUser, MutatingUser
from app.schemas.product import ProductSchema, ProductCreateRequest, ProductUpdateRequest
from app.schemas.page import PageResponse
from app.models.product import Product
from app.services import product_service
from app.services.product_query_builder import SearchCriteria, search

router = APIRouter(prefix="/api/products", tags=["products"])


def _product_dict(p):
    return ProductSchema.model_validate(p, from_attributes=True)


@router.get("", response_model_exclude_none=True)
def list_products(db: Annotated[Session, Depends(get_db)], user: CurrentUser,
                  page: int = Query(0, ge=0), size: int = Query(DEFAULT_PAGE_SIZE, ge=1),
                  sortBy: str = "name"):
    size = min(size, MAX_PAGE_SIZE)
    items, total = product_service.find_all(db, offset=page * size, limit=size)
    total_pages = math.ceil(total / size) if size else 0
    return {"content": [_product_dict(p) for p in items], "totalElements": total, "totalPages": total_pages, "number": page, "size": size}


@router.get("/search", response_model_exclude_none=True)
def search_products(db: Annotated[Session, Depends(get_db)], user: CurrentUser,
                    name: str | None = None, code: str | None = None,
                    type: str | None = None, state: str | None = None, allergen: str | None = None):
    criteria = SearchCriteria(name=name, code=code, product_type=type, state=state, allergen=allergen)
    items, _ = search(db, criteria, offset=0, limit=1000)
    return [_product_dict(p) for p in items]


@router.get("/stats", response_model_exclude_none=True)
def stats(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    from app.enums.product_state import ProductState
    return {s.value: product_service.count_by_state(db, s.value) for s in ProductState}


@router.get("/{product_id}", response_model_exclude_none=True)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return _product_dict(product_service.get_by_id(db, product_id))


@router.post("", status_code=201, response_model_exclude_none=True)
def create_product(body: ProductCreateRequest, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    p = Product()
    p.code = body.code; p.name = body.name; p.description = body.description
    p.product_type = body.productType; p.unit = body.unit
    if body.costPerKg is not None:
        from decimal import Decimal
        p.cost_per_kg = Decimal(str(body.costPerKg))
    p.formula_expression = body.formulaExpression; p.allergen_flags = body.allergenFlags
    p.created_by = user.username; p.updated_by = user.username
    return _product_dict(product_service.create_product(db, p, user.username))


@router.put("/{product_id}", response_model_exclude_none=True)
def update_product(product_id: int, body: ProductUpdateRequest, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return _product_dict(product_service.update_product(
        db, product_id, name=body.name, description=body.description, unit=body.unit,
        cost_per_kg=body.costPerKg, formula_expression=body.formulaExpression,
        allergen_flags=body.allergenFlags, performed_by=user.username))


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    product_service.delete_product(db, product_id, user.username)


@router.post("/{product_id}/composition", response_model_exclude_none=True)
def add_composition(product_id: int, body: dict, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return _product_dict(product_service.add_composition_line(db, product_id, body["ingredientId"], body["quantity"], body.get("unit", "%")))


@router.delete("/{product_id}/composition/{line_id}", response_model_exclude_none=True)
def remove_composition(product_id: int, line_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return _product_dict(product_service.remove_composition_line(db, product_id, line_id))


@router.get("/{product_id}/composition", response_model_exclude_none=True)
def get_composition(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    from app.schemas.product import CompositionLineSchema
    lines = product_service.get_composition(db, product_id)
    return [CompositionLineSchema.model_validate(l, from_attributes=True) for l in lines]


@router.get("/{product_id}/audit-history", response_model_exclude_none=True)
def audit_history(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    from app.services import audit_service
    from app.schemas.audit_log import AuditLogSchema
    logs = audit_service.get_product_history(db, product_id)
    return [AuditLogSchema.model_validate(l, from_attributes=True) for l in logs]
