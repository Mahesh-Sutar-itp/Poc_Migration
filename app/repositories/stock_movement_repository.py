from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.stock_movement import StockMovement


def find_by_stock_lot_id(db: Session, stock_lot_id: int) -> list[StockMovement]:
    return list(
        db.execute(
            select(StockMovement).where(StockMovement.stock_lot_id == stock_lot_id)
            .order_by(StockMovement.performed_at.desc())
        ).scalars().all()
    )


def save(db: Session, sm: StockMovement) -> StockMovement:
    db.add(sm)
    db.flush()
    db.refresh(sm)
    return sm
