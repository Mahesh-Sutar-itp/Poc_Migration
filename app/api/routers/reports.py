from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/dashboard-summary", response_model_exclude_none=True)
def dashboard(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return report_service.get_dashboard_summary(db, user.username)


@router.get("/cost-breakdown/{product_id}", response_model_exclude_none=True)
def cost_breakdown(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return report_service.get_cost_breakdown(db, product_id)


@router.get("/allergen-matrix", response_model_exclude_none=True)
def allergen_matrix(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return report_service.get_allergen_matrix(db)


@router.get("/quality-pass-rate", response_model_exclude_none=True)
def quality_pass_rate(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return report_service.get_quality_pass_rate(db)


@router.get("/activity", response_model_exclude_none=True)
def activity(db: Annotated[Session, Depends(get_db)], user: CurrentUser, limit: int = Query(20)):
    return report_service.get_recent_activity(db, limit)
