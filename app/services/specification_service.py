from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.specification import Specification
from app.repositories import product_repository, specification_repository


def get_for_product(db: Session, product_id: int) -> list[Specification]:
    return specification_repository.find_by_product_id(db, product_id)


def get_by_id(db: Session, spec_id: int) -> Specification:
    spec = specification_repository.find_by_id(db, spec_id)
    if not spec:
        raise EntityNotFoundException("Specification", spec_id)
    return spec


def create_specification(db: Session, product_id: int, parameter: str, spec_type: str,
                         min_value: float | None, max_value: float | None, target_value: float | None,
                         unit: str | None, created_by: str | None) -> Specification:
    product = product_repository.find_by_id(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)
    spec = Specification()
    spec.product_id = product_id
    spec.product = product
    spec.parameter = parameter
    spec.spec_type = spec_type
    spec.min_value = Decimal(str(min_value)) if min_value is not None else None
    spec.max_value = Decimal(str(max_value)) if max_value is not None else None
    spec.target_value = Decimal(str(target_value)) if target_value is not None else None
    spec.unit = unit
    spec.created_by = created_by
    saved = specification_repository.save(db, spec)
    db.commit()
    return saved


def update_specification(db: Session, spec_id: int, parameter: str | None, spec_type: str | None,
                         min_value: float | None, max_value: float | None, target_value: float | None,
                         unit: str | None) -> Specification:
    existing = get_by_id(db, spec_id)
    if parameter is not None:
        existing.parameter = parameter
    if spec_type is not None:
        existing.spec_type = spec_type
    if min_value is not None:
        existing.min_value = Decimal(str(min_value))
    if max_value is not None:
        existing.max_value = Decimal(str(max_value))
    if target_value is not None:
        existing.target_value = Decimal(str(target_value))
    if unit is not None:
        existing.unit = unit
    saved = specification_repository.save(db, existing)
    db.commit()
    return saved


def delete_specification(db: Session, spec_id: int) -> None:
    spec = get_by_id(db, spec_id)
    specification_repository.delete(db, spec)
    db.commit()
