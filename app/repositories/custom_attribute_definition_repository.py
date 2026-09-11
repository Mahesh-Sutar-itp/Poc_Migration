from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.custom_attribute_definition import CustomAttributeDefinition


def find_all(db: Session) -> list[CustomAttributeDefinition]:
    return list(
        db.execute(select(CustomAttributeDefinition).order_by(CustomAttributeDefinition.id)).scalars().all()
    )


def exists_by_attribute_key(db: Session, attribute_key: str) -> bool:
    return db.execute(
        select(CustomAttributeDefinition.id).where(CustomAttributeDefinition.attribute_key == attribute_key).limit(1)
    ).first() is not None


def save(db: Session, definition: CustomAttributeDefinition) -> CustomAttributeDefinition:
    db.add(definition)
    db.flush()
    db.refresh(definition)
    return definition
