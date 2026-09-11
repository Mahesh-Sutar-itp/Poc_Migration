import re

from sqlalchemy.orm import Session

from app.core.exceptions import FormCraftException
from app.enums.custom_attribute_type import CustomAttributeType
from app.models.custom_attribute_definition import CustomAttributeDefinition
from app.models.product import Product
from app.repositories import custom_attribute_definition_repository

_NUMBER_RE = re.compile(r"-?\d+(\.\d+)?")
_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")


def list_definitions(db: Session) -> list[CustomAttributeDefinition]:
    return custom_attribute_definition_repository.find_all(db)


def define_attribute(db: Session, definition: CustomAttributeDefinition) -> CustomAttributeDefinition:
    if custom_attribute_definition_repository.exists_by_attribute_key(db, definition.attribute_key):
        raise FormCraftException(f"Attribute '{definition.attribute_key}' is already defined")
    saved = custom_attribute_definition_repository.save(db, definition)
    db.commit()
    return saved


def validate(db: Session, product: Product) -> None:
    """Validates a product's custom_attributes against every registered definition
    applicable to its product type. Raises FormCraftException if any is violated."""
    attributes = product.custom_attributes or {}

    violations: list[str] = []
    for definition in custom_attribute_definition_repository.find_all(db):
        if definition.applies_to_product_type and definition.applies_to_product_type != product.product_type:
            continue
        _validate_one(definition, attributes.get(definition.attribute_key), violations)

    if violations:
        raise FormCraftException("Custom attribute validation failed: " + "; ".join(violations))


def _validate_one(definition: CustomAttributeDefinition, value: object, violations: list[str]) -> None:
    if value is None or (isinstance(value, str) and value.strip() == ""):
        if definition.required:
            violations.append(f"Attribute '{definition.attribute_key}' is required")
        return

    if not _matches_type(value, definition.data_type):
        violations.append(f"Attribute '{definition.attribute_key}' must be of type {definition.data_type}")
    elif definition.validation_regex and not re.fullmatch(definition.validation_regex, str(value)):
        violations.append(f"Attribute '{definition.attribute_key}' does not match the required format")


def _matches_type(value: object, data_type: str) -> bool:
    s = str(value)
    if data_type == CustomAttributeType.STRING.value:
        return True
    if data_type == CustomAttributeType.NUMBER.value:
        return bool(_NUMBER_RE.fullmatch(s))
    if data_type == CustomAttributeType.BOOLEAN.value:
        return s.lower() in ("true", "false")
    if data_type == CustomAttributeType.DATE.value:
        return bool(_DATE_RE.fullmatch(s))
    return False
