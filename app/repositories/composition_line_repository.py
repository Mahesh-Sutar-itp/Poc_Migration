from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.composition_line import CompositionLine


def find_by_product_id(db: Session, product_id: int) -> list[CompositionLine]:
    return list(
        db.execute(
            select(CompositionLine).where(CompositionLine.product_id == product_id)
            .order_by(CompositionLine.position.asc())
        ).scalars().all()
    )


def find_by_product_id_with_ingredient(db: Session, product_id: int) -> list[CompositionLine]:
    return list(
        db.execute(
            select(CompositionLine)
            .options(joinedload(CompositionLine.ingredient))
            .where(CompositionLine.product_id == product_id)
            .order_by(CompositionLine.position.asc())
        ).scalars().unique().all()
    )


def exists_by_ingredient_id(db: Session, ingredient_id: int) -> bool:
    return db.execute(
        select(CompositionLine.id).where(CompositionLine.ingredient_id == ingredient_id).limit(1)
    ).first() is not None


def delete_by_product_id(db: Session, product_id: int) -> int:
    from sqlalchemy import delete
    result = db.execute(delete(CompositionLine).where(CompositionLine.product_id == product_id))
    return result.rowcount


def save(db: Session, cl: CompositionLine) -> CompositionLine:
    db.add(cl)
    db.flush()
    return cl
