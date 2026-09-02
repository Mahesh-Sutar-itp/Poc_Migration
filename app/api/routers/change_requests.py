from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, MutatingUser
from app.schemas.change_request import ChangeRequestSchema, ChangeRequestCreateRequest, DecisionRequest
from app.services import change_request_service

router = APIRouter(tags=["change-requests"])


@router.get("/api/change-requests", response_model_exclude_none=True)
def list_all(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [ChangeRequestSchema.model_validate(cr, from_attributes=True) for cr in change_request_service.get_all(db)]


@router.get("/api/change-requests/{cr_id}", response_model_exclude_none=True)
def get_cr(cr_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return ChangeRequestSchema.model_validate(change_request_service.get_by_id(db, cr_id), from_attributes=True)


@router.get("/api/products/{product_id}/change-requests", response_model_exclude_none=True)
def list_for_product(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [ChangeRequestSchema.model_validate(cr, from_attributes=True) for cr in change_request_service.get_for_product(db, product_id)]


@router.post("/api/products/{product_id}/change-requests", status_code=201, response_model_exclude_none=True)
def create_cr(product_id: int, body: ChangeRequestCreateRequest, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    cr = change_request_service.create(db, product_id, body.title, body.description, body.reason, body.impact, user.username)
    return ChangeRequestSchema.model_validate(cr, from_attributes=True)


@router.post("/api/change-requests/{cr_id}/submit", response_model_exclude_none=True)
def submit(cr_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return ChangeRequestSchema.model_validate(change_request_service.submit(db, cr_id), from_attributes=True)


@router.post("/api/change-requests/{cr_id}/decide", response_model_exclude_none=True)
def decide(cr_id: int, body: DecisionRequest, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    approve = body.status.upper() in ("APPROVED", "TRUE", "YES")
    return ChangeRequestSchema.model_validate(
        change_request_service.decide(db, cr_id, approve, user.username, body.decisionComment), from_attributes=True)


@router.post("/api/change-requests/{cr_id}/implement", response_model_exclude_none=True)
def implement(cr_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return ChangeRequestSchema.model_validate(change_request_service.implement(db, cr_id), from_attributes=True)
