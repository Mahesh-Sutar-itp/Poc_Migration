import logging
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.constants import AUDIT_DELETE
from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.enums.product_state import ProductState
from app.enums.product_type import ProductType
from app.models.composition_line import CompositionLine
from app.models.product import Product
from app.repositories import composition_line_repository, product_repository
from app.services import audit_service

logger = logging.getLogger(__name__)


def create_product(db: Session, product: Product, performed_by: str | None = None) -> Product:
    if product_repository.exists_by_code(db, product.code):
        raise FormCraftException(f"Product with code '{product.code}' already exists")
    product.state = ProductState.DRAFT.value
    saved = product_repository.save(db, product)
    db.commit()
    audit_service.log_create(saved.id, f"code={saved.code} type={saved.product_type}", performed_by)
    return saved


def update_product(db: Session, product_id: int, name: str | None = None, description: str | None = None,
                   unit: str | None = None, cost_per_kg: float | None = None,
                   formula_expression: str | None = None, allergen_flags: str | None = None,
                   performed_by: str | None = None) -> Product:
    existing = get_by_id(db, product_id)
    if existing.state == ProductState.VALIDATED.value:
        raise FormCraftException("Cannot update a validated product — create a change order first")
    if name is not None:
        existing.name = name
    if description is not None:
        existing.description = description
    if unit is not None:
        existing.unit = unit
    if cost_per_kg is not None:
        existing.cost_per_kg = Decimal(str(cost_per_kg))
    if formula_expression is not None:
        existing.formula_expression = formula_expression
    if allergen_flags is not None:
        existing.allergen_flags = allergen_flags
    saved = product_repository.save(db, existing)
    db.commit()
    audit_service.log_update(product_id, f"name={existing.name}", performed_by)
    return saved


def get_by_id(db: Session, product_id: int) -> Product:
    p = product_repository.find_by_id(db, product_id)
    if not p:
        raise EntityNotFoundException("Product", product_id)
    return p


def find_all(db: Session, offset: int = 0, limit: int = 20) -> tuple[list[Product], int]:
    items = product_repository.find_all(db, offset=offset, limit=limit)
    total = product_repository.count_all(db)
    return items, total


def delete_product(db: Session, product_id: int, performed_by: str | None = None) -> None:
    product = get_by_id(db, product_id)
    if product.state not in (ProductState.DRAFT.value, ProductState.ARCHIVED.value):
        raise FormCraftException(f"Cannot delete product in state {product.state} — only DRAFT or ARCHIVED products can be deleted")
    if composition_line_repository.exists_by_ingredient_id(db, product_id):
        raise FormCraftException(f"Cannot delete product '{product.code}' — it is used as an ingredient in another product's composition")
    product_repository.delete(db, product)
    db.commit()
    audit_service.log_action(product_id, "Product", AUDIT_DELETE, f"DELETED code={product.code}", performed_by)


def add_composition_line(db: Session, product_id: int, ingredient_id: int, quantity: float, unit: str) -> Product:
    product = get_by_id(db, product_id)
    ingredient = product_repository.find_by_id(db, ingredient_id)
    if not ingredient:
        raise EntityNotFoundException("Ingredient", ingredient_id)
    if ingredient.product_type not in (ProductType.RAW_MATERIAL.value, ProductType.SEMI_FINISHED.value):
        raise FormCraftException("Ingredient must be a RAW_MATERIAL or SEMI_FINISHED product")
    line = CompositionLine()
    line.product_id = product_id
    line.product = product
    line.ingredient_id = ingredient_id
    line.ingredient = ingredient
    line.quantity = Decimal(str(quantity))
    line.unit = unit
    line.position = len(product.composition_lines) + 1
    composition_line_repository.save(db, line)
    db.commit()
    db.refresh(product)
    return product


def remove_composition_line(db: Session, product_id: int, line_id: int) -> Product:
    from app.repositories import composition_line_repository as cl_repo
    from sqlalchemy import select
    from app.models.composition_line import CompositionLine as CL
    line = db.get(CL, line_id)
    if not line:
        raise EntityNotFoundException("CompositionLine", line_id)
    if line.product_id != product_id:
        raise FormCraftException(f"Composition line does not belong to product {product_id}")
    db.delete(line)
    db.flush()
    db.commit()
    product = get_by_id(db, product_id)
    db.refresh(product)
    return product


def get_composition(db: Session, product_id: int) -> list[CompositionLine]:
    return composition_line_repository.find_by_product_id_with_ingredient(db, product_id)


def count_by_state(db: Session, state: str) -> int:
    return product_repository.count_by_state(db, state)
