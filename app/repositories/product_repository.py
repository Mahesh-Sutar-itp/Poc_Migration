from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.composition_line import CompositionLine
from app.models.product import Product


def find_by_id(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def find_by_code(db: Session, code: str) -> Product | None:
    return db.execute(select(Product).where(Product.code == code)).scalar_one_or_none()


def exists_by_code(db: Session, code: str) -> bool:
    return db.execute(select(Product.id).where(Product.code == code).limit(1)).first() is not None


def find_by_product_type(db: Session, product_type: str) -> list[Product]:
    return list(
        db.execute(select(Product).where(Product.product_type == product_type)).scalars().all()
    )


def find_by_state(db: Session, state: str) -> list[Product]:
    return list(
        db.execute(select(Product).where(Product.state == state)).scalars().all()
    )


def find_by_state_and_types(db: Session, state: str, types: list[str]) -> list[Product]:
    return list(
        db.execute(
            select(Product).where(Product.state == state, Product.product_type.in_(types))
        ).scalars().all()
    )


def find_by_id_with_composition(db: Session, product_id: int) -> Product | None:
    return db.execute(
        select(Product)
        .options(selectinload(Product.composition_lines).joinedload(CompositionLine.ingredient))
        .where(Product.id == product_id)
    ).scalar_one_or_none()


def count_by_state(db: Session, state: str) -> int:
    return db.execute(
        select(func.count(Product.id)).where(Product.state == state)
    ).scalar_one()


def find_all(db: Session, offset: int = 0, limit: int = 20) -> list[Product]:
    return list(
        db.execute(select(Product).order_by(Product.id).offset(offset).limit(limit)).scalars().all()
    )


def count_all(db: Session) -> int:
    return db.execute(select(func.count(Product.id))).scalar_one()


def save(db: Session, product: Product) -> Product:
    db.add(product)
    db.flush()
    db.refresh(product)
    return product


def delete(db: Session, product: Product) -> None:
    db.delete(product)
    db.flush()
