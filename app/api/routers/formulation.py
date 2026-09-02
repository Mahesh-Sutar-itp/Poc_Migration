from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, AdminOrPLM
from app.services.formulation import formulation_service
from app.repositories import formulation_result_repository, product_repository
from app.schemas.formulation_result import FormulationResultSchema

router = APIRouter(prefix="/api/products/{product_id}/formulate", tags=["formulation"])


@router.post("", response_model_exclude_none=True)
def formulate(product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPLM,
              chainId: str = Query("default")):
    product = formulation_service.formulate(db, product_id, chainId, user.username)
    results = formulation_result_repository.find_by_product_id(db, product_id)
    latest = results[0] if results else None
    return {"product": {"id": product.id, "code": product.code, "name": product.name},
            "latestResult": FormulationResultSchema.model_validate(latest, from_attributes=True) if latest else None}


@router.get("/history", response_model_exclude_none=True)
def history(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    results = formulation_result_repository.find_by_product_id(db, product_id)
    return [FormulationResultSchema.model_validate(r, from_attributes=True) for r in results]


@router.get("/check", response_model_exclude_none=True)
def check(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    p = product_repository.find_by_id(db, product_id)
    should = p is not None and p.product_type != "RAW_MATERIAL"
    return {"shouldFormulate": should}
