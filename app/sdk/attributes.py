"""Customization Gate 2 — dynamic Product columns.

A custom attribute defined by an admin becomes a real column on `products`, added by DDL at
definition time and mapped onto the Product ORM class in the same call. Values are stored,
typed, indexed and queried like any core field instead of being buried in a JSON document.

Physical columns carry an `x_` prefix, so a custom attribute can never collide with — or
silently shadow — a core column such as `name` or `state`.
"""

from __future__ import annotations

import datetime
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from sqlalchemy import Boolean, Column, Date, Numeric, String, text
from sqlalchemy.orm import Session

from app.core.exceptions import FormCraftException
from app.enums.custom_attribute_type import CustomAttributeType

TABLE_NAME = "products"
COLUMN_PREFIX = "x_"
MAX_KEY_LENGTH = 50

# Postgres folds unquoted identifiers to lower case and the key is interpolated into DDL,
# so anything outside this shape is rejected before it reaches the database.
_KEY_RE = re.compile(rf"^[a-z][a-z0-9_]{{0,{MAX_KEY_LENGTH - 1}}}$")
_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")

_SQL_TYPES = {
    CustomAttributeType.STRING.value: "VARCHAR(255)",
    CustomAttributeType.NUMBER.value: "NUMERIC(18,6)",
    CustomAttributeType.BOOLEAN.value: "BOOLEAN",
    CustomAttributeType.DATE.value: "DATE",
}

_ORM_TYPES = {
    CustomAttributeType.STRING.value: lambda: String(255),
    CustomAttributeType.NUMBER.value: lambda: Numeric(18, 6),
    CustomAttributeType.BOOLEAN.value: Boolean,
    CustomAttributeType.DATE.value: Date,
}


@dataclass(frozen=True)
class AttachedAttribute:
    attribute_key: str
    column_name: str
    data_type: str
    applies_to_product_type: str | None


_attached: dict[str, AttachedAttribute] = {}


def column_name(attribute_key: str) -> str:
    return COLUMN_PREFIX + attribute_key


def sql_type(data_type: str) -> str:
    return _SQL_TYPES[data_type]


def validate_definition(attribute_key: str, data_type: str) -> None:
    if data_type not in _SQL_TYPES:
        raise FormCraftException(
            f"Unknown attribute data type '{data_type}' — expected one of {', '.join(sorted(_SQL_TYPES))}"
        )
    if not _KEY_RE.fullmatch(attribute_key or ""):
        raise FormCraftException(
            f"Attribute key '{attribute_key}' is not a valid column name — use lower-case letters, "
            f"digits and underscores, starting with a letter, at most {MAX_KEY_LENGTH} characters"
        )


def add_column(db: Session, attribute_key: str, data_type: str) -> str:
    """Widens the products table to carry this attribute. Idempotent, so a definition that
    already has its column (a redeploy, a manifest replay) is a no-op."""
    validate_definition(attribute_key, data_type)
    name = column_name(attribute_key)
    db.execute(text(f'ALTER TABLE {TABLE_NAME} ADD COLUMN IF NOT EXISTS "{name}" {sql_type(data_type)}'))
    return name


def attach(attribute_key: str, data_type: str, applies_to_product_type: str | None) -> AttachedAttribute:
    """Maps the column onto the Product class so the ORM loads and persists it like any
    core field. Declarative picks up a Column assigned to a mapped class after mapping."""
    from app.models.product import Product

    name = column_name(attribute_key)
    if name not in Product.__table__.columns:
        setattr(Product, name, Column(name, _ORM_TYPES[data_type](), nullable=True))

    attribute = AttachedAttribute(attribute_key, name, data_type, applies_to_product_type)
    _attached[attribute_key] = attribute
    return attribute


def attached_attributes() -> list[AttachedAttribute]:
    return list(_attached.values())


def is_attached(attribute_key: str) -> bool:
    return attribute_key in _attached


def coerce(data_type: str, value: object) -> object | None:
    """Turns a value off the wire into what the typed column expects."""
    if value is None or (isinstance(value, str) and not value.strip()):
        return None

    if data_type == CustomAttributeType.STRING.value:
        return str(value)

    if data_type == CustomAttributeType.NUMBER.value:
        try:
            return Decimal(str(value))
        except InvalidOperation:
            raise FormCraftException(f"'{value}' is not a valid number")

    if data_type == CustomAttributeType.BOOLEAN.value:
        if isinstance(value, bool):
            return value
        text_value = str(value).strip().lower()
        if text_value not in ("true", "false"):
            raise FormCraftException(f"'{value}' is not a valid boolean")
        return text_value == "true"

    if data_type == CustomAttributeType.DATE.value:
        if isinstance(value, datetime.date):
            return value
        if not _DATE_RE.fullmatch(str(value)):
            raise FormCraftException(f"'{value}' is not a valid date — expected YYYY-MM-DD")
        return datetime.date.fromisoformat(str(value))

    raise FormCraftException(f"Unknown attribute data type '{data_type}'")


def to_json_value(value: object) -> object:
    """Renders a column value as the JSON scalar the API has always exposed, so the typed
    storage underneath stays invisible to clients."""
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime.date):
        return value.isoformat()
    return value


def reset_for_tests() -> None:
    _attached.clear()
