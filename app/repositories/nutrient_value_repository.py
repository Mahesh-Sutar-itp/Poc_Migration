from sqlalchemy import delete as sa_delete
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.nutrient_value import NutrientValue


def find_by_product_id(db: Session, product_id: int) -> list[NutrientValue]:
    return list(
        db.execute(
            select(NutrientValue).where(NutrientValue.product_id == product_id)
        ).scalars().all()
    )


def find_by_product_and_type(db: Session, product_id: int, nutrient_type: str) -> NutrientValue | None:
    return db.execute(
        select(NutrientValue).where(
            NutrientValue.product_id == product_id, NutrientValue.nutrient_type == nutrient_type
        )
    ).scalar_one_or_none()


def delete_by_product_id(db: Session, product_id: int) -> int:
    result = db.execute(sa_delete(NutrientValue).where(NutrientValue.product_id == product_id))
    return result.rowcount


def save(db: Session, nv: NutrientValue) -> NutrientValue:
    db.add(nv)
    db.flush()
    return nv
