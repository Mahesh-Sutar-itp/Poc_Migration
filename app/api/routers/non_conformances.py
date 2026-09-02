from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, AdminOrQuality
from app.schemas.non_conformance import NonConformanceSchema, NonConformanceCreateRequest
from app.schemas.corrective_action import CorrectiveActionSchema, CorrectiveActionCreateRequest
from app.services import non_conformance_service
from app.enums.nc_status import NcStatus

router = APIRouter(tags=["non-conformances"])


@router.get("/api/non-conformances", response_model_exclude_none=True)
def list_all(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    items, _ = non_conformance_service.get_all(db, offset=0, limit=10000)
    return [NonConformanceSchema.model_validate(nc, from_attributes=True) for nc in items]


@router.get("/api/non-conformances/stats", response_model_exclude_none=True)
def stats(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    from app.repositories import non_conformance_repository
    return {s.value: non_conformance_repository.count_by_status(db, s.value) for s in NcStatus}


@router.get("/api/non-conformances/{nc_id}", response_model_exclude_none=True)
def get_nc(nc_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return NonConformanceSchema.model_validate(non_conformance_service.get_by_id(db, nc_id), from_attributes=True)


@router.get("/api/products/{product_id}/non-conformances", response_model_exclude_none=True)
def list_for_product(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [NonConformanceSchema.model_validate(nc, from_attributes=True) for nc in non_conformance_service.get_for_product(db, product_id)]


@router.post("/api/products/{product_id}/non-conformances", status_code=201, response_model_exclude_none=True)
def raise_nc(product_id: int, body: NonConformanceCreateRequest, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    nc = non_conformance_service.raise_nc(db, product_id, body.title, body.description, body.severity, user.username)
    return NonConformanceSchema.model_validate(nc, from_attributes=True)


@router.post("/api/non-conformances/{nc_id}/transition", response_model_exclude_none=True)
def transition(nc_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality, target: str = Query(...)):
    return NonConformanceSchema.model_validate(non_conformance_service.transition_status(db, nc_id, target), from_attributes=True)


@router.post("/api/non-conformances/{nc_id}/close", response_model_exclude_none=True)
def close(nc_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    return NonConformanceSchema.model_validate(non_conformance_service.transition_status(db, nc_id, NcStatus.CLOSED.value), from_attributes=True)


@router.get("/api/non-conformances/{nc_id}/actions", response_model_exclude_none=True)
def list_actions(nc_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [CorrectiveActionSchema.model_validate(a, from_attributes=True) for a in non_conformance_service.get_corrective_actions(db, nc_id)]


@router.post("/api/non-conformances/{nc_id}/actions", status_code=201, response_model_exclude_none=True)
def add_action(nc_id: int, body: CorrectiveActionCreateRequest, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    return CorrectiveActionSchema.model_validate(non_conformance_service.add_corrective_action(db, nc_id, body.description, body.owner, body.dueDate), from_attributes=True)


@router.post("/api/non-conformances/{nc_id}/actions/{action_id}/close", response_model_exclude_none=True)
def close_action(nc_id: int, action_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    return CorrectiveActionSchema.model_validate(non_conformance_service.close_corrective_action(db, nc_id, action_id), from_attributes=True)
