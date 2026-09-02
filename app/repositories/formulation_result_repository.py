from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.formulation_result import FormulationResult


def find_by_product_id(db: Session, product_id: int) -> list[FormulationResult]:
    return list(
        db.execute(
            select(FormulationResult)
            .where(FormulationResult.product_id == product_id)
            .order_by(FormulationResult.formulated_at.desc())
        ).scalars().all()
    )


def find_latest(db: Session, product_id: int, chain_id: str) -> FormulationResult | None:
    return db.execute(
        select(FormulationResult)
        .where(FormulationResult.product_id == product_id, FormulationResult.chain_id == chain_id)
        .order_by(FormulationResult.formulated_at.desc())
        .limit(1)
    ).scalar_one_or_none()


def save(db: Session, fr: FormulationResult) -> FormulationResult:
    db.add(fr)
    db.flush()
    db.refresh(fr)
    return fr
