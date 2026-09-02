from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, AdminOrQuality
from app.schemas.quality_check import QualityCheckSchema
from app.services import quality_service

router = APIRouter(prefix="/api/products/{product_id}/quality", tags=["quality"])


@router.post("/run-all", response_model_exclude_none=True)
def run_all(product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    return [QualityCheckSchema.model_validate(c, from_attributes=True) for c in quality_service.run_all_checks(db, product_id)]


@router.post("/run/{check_type}", response_model_exclude_none=True)
def run_check(product_id: int, check_type: str, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    return QualityCheckSchema.model_validate(quality_service.run_check(db, product_id, check_type), from_attributes=True)


@router.get("", response_model_exclude_none=True)
def list_checks(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [QualityCheckSchema.model_validate(c, from_attributes=True) for c in quality_service.get_checks_for_product(db, product_id)]


@router.get("/status", response_model_exclude_none=True)
def quality_status(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    checks = quality_service.get_checks_for_product(db, product_id)
    all_passed = len(checks) > 0 and all(c.status == "PASSED" for c in checks)
    return {"allPassed": all_passed}
