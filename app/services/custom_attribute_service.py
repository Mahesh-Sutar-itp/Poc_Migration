"""Customization Gate 2 — client-defined attributes on Product.

Defining an attribute is a schema change, not a document edit: the products table gains a
real typed column, the ORM is widened to map it, and the change is mirrored into the
customization repo's manifest so it is versioned in the client's own repo.
"""

import logging
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.exceptions import FormCraftException
from app.models.custom_attribute_definition import CustomAttributeDefinition
from app.models.product import Product
from app.repositories import custom_attribute_definition_repository
from app.sdk import attributes
from app.services import custom_attribute_manifest

logger = logging.getLogger(__name__)

# The definitions table is created here as well as in alembic: this repo's 0001/0002
# migrations depend on SQL that is not shipped in the image, so a database seeded by hand
# would otherwise have no Gate 2 metadata at all.
_METADATA_DDL = """
CREATE TABLE IF NOT EXISTS product_attribute_definitions (
    id                       BIGSERIAL PRIMARY KEY,
    attribute_key            VARCHAR(100) NOT NULL UNIQUE,
    label                    VARCHAR(150) NOT NULL,
    data_type                VARCHAR(20) NOT NULL,
    required                 BOOLEAN NOT NULL DEFAULT FALSE,
    applies_to_product_type  VARCHAR(30),
    validation_regex         VARCHAR(255),
    column_name              VARCHAR(63),
    created_at               TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE product_attribute_definitions ADD COLUMN IF NOT EXISTS column_name VARCHAR(63);
"""


def list_definitions(db: Session) -> list[CustomAttributeDefinition]:
    return custom_attribute_definition_repository.find_all(db)


def define_attribute(db: Session, definition: CustomAttributeDefinition) -> CustomAttributeDefinition:
    attributes.validate_definition(definition.attribute_key, definition.data_type)
    if custom_attribute_definition_repository.exists_by_attribute_key(db, definition.attribute_key):
        raise FormCraftException(f"Attribute '{definition.attribute_key}' is already defined")

    definition.column_name = attributes.column_name(definition.attribute_key)
    saved = custom_attribute_definition_repository.save(db, definition)
    # Postgres DDL is transactional, so the column and its metadata row land together.
    attributes.add_column(db, saved.attribute_key, saved.data_type)
    db.commit()

    attributes.attach(saved.attribute_key, saved.data_type, saved.applies_to_product_type)
    custom_attribute_manifest.upsert(_manifest_entry(saved))
    return saved


def sync(db: Session) -> None:
    """Startup reconciliation between the mounted customization repo, the database and the
    ORM. Adopts manifest entries the database has not seen, then guarantees every definition
    has its column and is mapped."""
    db.execute(text(_METADATA_DDL))
    db.commit()

    _adopt_manifest(db)

    definitions = custom_attribute_definition_repository.find_all(db)
    for definition in definitions:
        attributes.add_column(db, definition.attribute_key, definition.data_type)
        if definition.column_name is None:
            definition.column_name = attributes.column_name(definition.attribute_key)
        attributes.attach(definition.attribute_key, definition.data_type, definition.applies_to_product_type)
    db.commit()

    for definition in definitions:
        custom_attribute_manifest.upsert(_manifest_entry(definition))

    logger.info("Customization Gate 2: %d custom attribute column(s) mapped", len(definitions))


def validate_and_apply(db: Session, product: Product) -> None:
    """Validates the attribute values submitted for this product against every applicable
    definition and writes them to their columns. Raises FormCraftException if any rule fails."""
    submitted = product.take_submitted_custom_attributes()

    applicable = [
        definition
        for definition in custom_attribute_definition_repository.find_all(db)
        if _applies(definition, product)
    ]
    by_key = {definition.attribute_key: definition for definition in applicable}

    violations: list[str] = []
    if submitted is not None:
        for key in sorted(set(submitted) - set(by_key)):
            violations.append(
                f"Attribute '{key}' is not a custom attribute defined for product type {product.product_type}"
            )

    values = submitted if submitted is not None else product.custom_attributes
    for definition in applicable:
        _validate_one(definition, values.get(definition.attribute_key), violations)

    if violations:
        raise FormCraftException("Custom attribute validation failed: " + "; ".join(violations))

    if submitted is None:
        return

    for definition in applicable:
        if not attributes.is_attached(definition.attribute_key):
            continue
        setattr(
            product,
            attributes.column_name(definition.attribute_key),
            attributes.coerce(definition.data_type, submitted.get(definition.attribute_key)),
        )


def _adopt_manifest(db: Session) -> None:
    """Creates definitions for attributes the customization repo declares but this database
    has never seen — the path that rebuilds a client's columns on a fresh environment."""
    for entry in custom_attribute_manifest.load():
        key = entry.get("attributeKey")
        data_type = entry.get("dataType")
        if not isinstance(key, str) or not isinstance(data_type, str):
            logger.warning("Skipping malformed custom attribute manifest entry: %r", entry)
            continue
        try:
            attributes.validate_definition(key, data_type)
        except FormCraftException as exc:
            logger.warning("Skipping custom attribute '%s' from manifest: %s", key, exc.message)
            continue
        if custom_attribute_definition_repository.exists_by_attribute_key(db, key):
            continue

        definition = CustomAttributeDefinition()
        definition.attribute_key = key
        definition.label = entry.get("label") or key
        definition.data_type = data_type
        definition.required = bool(entry.get("required", False))
        definition.applies_to_product_type = entry.get("appliesToProductType")
        definition.validation_regex = entry.get("validationRegex")
        definition.column_name = attributes.column_name(key)
        custom_attribute_definition_repository.save(db, definition)
        logger.info("Adopted custom attribute '%s' from the customization repo manifest", key)
    db.commit()


def _manifest_entry(definition: CustomAttributeDefinition) -> dict:
    return {
        "attributeKey": definition.attribute_key,
        "columnName": definition.column_name or attributes.column_name(definition.attribute_key),
        "label": definition.label,
        "dataType": definition.data_type,
        "sqlType": attributes.sql_type(definition.data_type),
        "required": bool(definition.required),
        "appliesToProductType": definition.applies_to_product_type,
        "validationRegex": definition.validation_regex,
    }


def _applies(definition: CustomAttributeDefinition, product: Product) -> bool:
    return (
        not definition.applies_to_product_type
        or definition.applies_to_product_type == product.product_type
    )


def _validate_one(definition: CustomAttributeDefinition, value: object, violations: list[str]) -> None:
    if value is None or (isinstance(value, str) and value.strip() == ""):
        if definition.required:
            violations.append(f"Attribute '{definition.attribute_key}' is required")
        return

    try:
        coerced = attributes.coerce(definition.data_type, value)
    except FormCraftException:
        violations.append(f"Attribute '{definition.attribute_key}' must be of type {definition.data_type}")
        return

    if definition.validation_regex and not re.fullmatch(definition.validation_regex, str(value)):
        violations.append(f"Attribute '{definition.attribute_key}' does not match the required format")
    elif coerced is None and definition.required:
        violations.append(f"Attribute '{definition.attribute_key}' is required")
