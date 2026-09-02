from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, AdminOrQuality
from app.schemas.specification import SpecificationSchema, SpecificationCreateRequest, SpecificationUpdateRequest
from app.services import specification_service

router = APIRouter(tags=["specifications"])


@router.get("/api/products/{product_id}/specifications", response_model_exclude_none=True)
def list_specs(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [SpecificationSchema.model_validate(s, from_attributes=True) for s in specification_service.get_for_product(db, product_id)]


@router.post("/api/products/{product_id}/specifications", status_code=201, response_model_exclude_none=True)
def create_spec(product_id: int, body: SpecificationCreateRequest, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    spec = specification_service.create_specification(db, product_id, body.parameter, body.specType,
        body.minValue, body.maxValue, body.targetValue, body.unit, user.username)
    return SpecificationSchema.model_validate(spec, from_attributes=True)


@router.put("/api/specifications/{spec_id}", response_model_exclude_none=True)
def update_spec(spec_id: int, body: SpecificationUpdateRequest, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    spec = specification_service.update_specification(db, spec_id, body.parameter, body.specType,
        body.minValue, body.maxValue, body.targetValue, body.unit)
    return SpecificationSchema.model_validate(spec, from_attributes=True)


@router.delete("/api/specifications/{spec_id}", status_code=204)
def delete_spec(spec_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrQuality):
    specification_service.delete_specification(db, spec_id)
