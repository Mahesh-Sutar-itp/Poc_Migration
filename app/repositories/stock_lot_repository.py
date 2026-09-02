from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.stock_lot import StockLot


def find_by_id(db: Session, lot_id: int) -> StockLot | None:
    return db.get(StockLot, lot_id)


def find_by_product_id(db: Session, product_id: int) -> list[StockLot]:
    return list(
        db.execute(
            select(StockLot)
            .options(joinedload(StockLot.product))
            .where(StockLot.product_id == product_id)
            .order_by(StockLot.expiry_date.asc().nulls_last())
        ).scalars().unique().all()
    )


def find_all_with_details(db: Session, offset: int = 0, limit: int = 20) -> list[StockLot]:
    return list(
        db.execute(
            select(StockLot)
            .options(joinedload(StockLot.product), joinedload(StockLot.supplier))
            .order_by(StockLot.received_at.desc())
            .offset(offset).limit(limit)
        ).scalars().unique().all()
    )


def count_all(db: Session) -> int:
    return db.execute(select(func.count(StockLot.id))).scalar_one()


def total_on_hand_for_product(db: Session, product_id: int) -> float:
    result = db.execute(
        select(func.coalesce(func.sum(StockLot.quantity_on_hand), 0))
        .where(StockLot.product_id == product_id, StockLot.status == "ACTIVE")
    ).scalar_one()
    return float(result)


def save(db: Session, lot: StockLot) -> StockLot:
    db.add(lot)
    db.flush()
    db.refresh(lot)
    return lot
