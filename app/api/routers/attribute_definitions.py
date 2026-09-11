from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import AdminUser
from app.core.database import get_db
from app.models.custom_attribute_definition import CustomAttributeDefinition
from app.schemas.custom_attribute_definition import CustomAttributeDefinitionSchema, DefineAttributeRequest
from app.services import custom_attribute_service

# Admin-facing endpoint for Customization Gate 2 (BMIDE-style): register a custom
# attribute on Product without a schema migration or a Python code change.
router = APIRouter(prefix="/api/attribute-definitions", tags=["customizations"])


@router.get("", response_model_exclude_none=True)
def list_definitions(db: Annotated[Session, Depends(get_db)], user: AdminUser):
    return [
        CustomAttributeDefinitionSchema.model_validate(d, from_attributes=True)
        for d in custom_attribute_service.list_definitions(db)
    ]


@router.post("", status_code=201, response_model_exclude_none=True)
def define_attribute(body: DefineAttributeRequest, db: Annotated[Session, Depends(get_db)], user: AdminUser):
    definition = CustomAttributeDefinition()
    definition.attribute_key = body.attributeKey
    definition.label = body.label
    definition.data_type = body.dataType
    definition.required = body.required
    definition.applies_to_product_type = body.appliesToProductType
    definition.validation_regex = body.validationRegex

    saved = custom_attribute_service.define_attribute(db, definition)
    return CustomAttributeDefinitionSchema.model_validate(saved, from_attributes=True)
