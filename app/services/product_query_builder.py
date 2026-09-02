import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product

logger = logging.getLogger(__name__)


@dataclass
class SearchCriteria:
    name: str | None = None
    code: str | None = None
    product_type: str | None = None
    state: str | None = None
    allergen: str | None = None
    has_formula_expression: bool | None = None


def search(db: Session, criteria: SearchCriteria, offset: int = 0, limit: int = 20) -> tuple[list[Product], int]:
    from sqlalchemy import func
    stmt = select(Product)
    count_stmt = select(func.count(Product.id))

    conditions = _build_conditions(criteria)
    for cond in conditions:
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    total = db.execute(count_stmt).scalar_one()
    items = list(db.execute(stmt.order_by(Product.id).offset(offset).limit(limit)).scalars().all())
    return items, total


def _build_conditions(criteria: SearchCriteria) -> list:
    conditions = []
    if criteria.name:
        conditions.append(Product.name.ilike(f"%{criteria.name}%"))
    if criteria.code:
        conditions.append(Product.code.ilike(f"%{criteria.code}%"))
    if criteria.product_type:
        conditions.append(Product.product_type == criteria.product_type)
    if criteria.state:
        conditions.append(Product.state == criteria.state)
    if criteria.allergen:
        conditions.append(Product.allergen_flags.ilike(f"%{criteria.allergen}%"))
    if criteria.has_formula_expression is True:
        conditions.append(Product.formula_expression.isnot(None))
        conditions.append(Product.formula_expression != "")
    elif criteria.has_formula_expression is False:
        from sqlalchemy import or_
        conditions.append(or_(Product.formula_expression.is_(None), Product.formula_expression == ""))
    return conditions
