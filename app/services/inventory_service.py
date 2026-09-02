import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.enums.notification_category import NotificationCategory
from app.enums.stock_movement_type import StockMovementType
from app.enums.user_role import UserRole
from app.models.stock_lot import StockLot
from app.models.stock_movement import StockMovement
from app.repositories import product_repository, stock_lot_repository, stock_movement_repository, supplier_repository
from app.services import notification_service

DEFAULT_LOW_STOCK_THRESHOLD = Decimal("30")


def get_all_lots(db: Session, offset: int = 0, limit: int = 20) -> tuple[list[StockLot], int]:
    items = stock_lot_repository.find_all_with_details(db, offset=offset, limit=limit)
    total = stock_lot_repository.count_all(db)
    return items, total


def get_lots_for_product(db: Session, product_id: int) -> list[StockLot]:
    return stock_lot_repository.find_by_product_id(db, product_id)


def get_lot(db: Session, lot_id: int) -> StockLot:
    lot = stock_lot_repository.find_by_id(db, lot_id)
    if not lot:
        raise EntityNotFoundException("StockLot", lot_id)
    return lot


def receive_lot(db: Session, product_id: int, lot_number: str, quantity: Decimal, unit: str | None,
                expiry_date: str | None, supplier_id: int | None, performed_by: str | None) -> StockLot:
    product = product_repository.find_by_id(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)
    lot = StockLot()
    lot.product_id = product_id
    lot.product = product
    lot.lot_number = lot_number
    lot.quantity_on_hand = quantity
    lot.unit = unit
    lot.status = "ACTIVE"
    if expiry_date:
        lot.expiry_date = datetime.date.fromisoformat(expiry_date)
    if supplier_id:
        supplier = supplier_repository.find_by_id(db, supplier_id)
        if not supplier:
            raise EntityNotFoundException("Supplier", supplier_id)
        lot.supplier_id = supplier_id
        lot.supplier = supplier
    saved = stock_lot_repository.save(db, lot)
    _record_movement(db, saved, StockMovementType.RECEIVE.value, quantity, performed_by, "Initial receipt")
    db.commit()
    return saved


def consume(db: Session, lot_id: int, quantity: Decimal, performed_by: str | None, reference: str | None) -> StockMovement:
    lot = get_lot(db, lot_id)
    if lot.quantity_on_hand < quantity:
        raise FormCraftException(f"Insufficient stock in lot {lot.lot_number}: on hand={lot.quantity_on_hand}, requested={quantity}")
    lot.quantity_on_hand = lot.quantity_on_hand - quantity
    stock_lot_repository.save(db, lot)
    movement = _record_movement(db, lot, StockMovementType.CONSUME.value, quantity, performed_by, reference)
    if lot.quantity_on_hand < DEFAULT_LOW_STOCK_THRESHOLD:
        notification_service.notify_role(db, UserRole.PURCHASING.value, "Low stock alert",
            f"{lot.product.name} (lot {lot.lot_number}) is low: {lot.quantity_on_hand} {lot.unit} remaining.",
            "/inventory", NotificationCategory.INVENTORY.value)
    db.commit()
    return movement


def adjust(db: Session, lot_id: int, delta: Decimal, performed_by: str | None, reference: str | None) -> StockMovement:
    lot = get_lot(db, lot_id)
    new_qty = lot.quantity_on_hand + delta
    if new_qty < 0:
        raise FormCraftException(f"Adjustment would result in negative stock for lot {lot.lot_number}")
    lot.quantity_on_hand = new_qty
    stock_lot_repository.save(db, lot)
    movement = _record_movement(db, lot, StockMovementType.ADJUST.value, delta, performed_by, reference)
    db.commit()
    return movement


def get_movements(db: Session, lot_id: int) -> list[StockMovement]:
    return stock_movement_repository.find_by_stock_lot_id(db, lot_id)


def get_low_stock(db: Session, threshold: Decimal | None = None) -> list[StockLot]:
    effective = threshold or DEFAULT_LOW_STOCK_THRESHOLD
    all_lots = stock_lot_repository.find_all_with_details(db, offset=0, limit=10000)
    return [lot for lot in all_lots if lot.status == "ACTIVE" and lot.quantity_on_hand < effective]


def _record_movement(db: Session, lot: StockLot, movement_type: str, quantity: Decimal, performed_by: str | None, reference: str | None) -> StockMovement:
    m = StockMovement()
    m.stock_lot_id = lot.id
    m.stock_lot = lot
    m.movement_type = movement_type
    m.quantity = quantity
    m.performed_by = performed_by
    m.reference = reference
    return stock_movement_repository.save(db, m)
