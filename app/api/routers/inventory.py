from typing import Annotated
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, AdminOrPurchasing
from app.schemas.stock_lot import StockLotSchema, StockMovementSchema
from app.services import inventory_service

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/lots", response_model_exclude_none=True)
def list_lots(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    items, _ = inventory_service.get_all_lots(db, offset=0, limit=10000)
    return [StockLotSchema.model_validate(l, from_attributes=True) for l in items]


@router.get("/lots/{lot_id}", response_model_exclude_none=True)
def get_lot(lot_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return StockLotSchema.model_validate(inventory_service.get_lot(db, lot_id), from_attributes=True)


@router.get("/products/{product_id}/lots", response_model_exclude_none=True)
def lots_for_product(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [StockLotSchema.model_validate(l, from_attributes=True) for l in inventory_service.get_lots_for_product(db, product_id)]


@router.post("/products/{product_id}/lots", status_code=201, response_model_exclude_none=True)
def receive_lot(product_id: int, body: dict, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    lot = inventory_service.receive_lot(db, product_id, body["lotNumber"], Decimal(str(body["quantity"])),
        body.get("unit"), body.get("expiryDate"), body.get("supplierId"), user.username)
    return StockLotSchema.model_validate(lot, from_attributes=True)


@router.post("/lots/{lot_id}/receive", response_model_exclude_none=True)
def receive_into(lot_id: int, body: dict, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    lot = inventory_service.get_lot(db, lot_id)
    lot.quantity_on_hand = lot.quantity_on_hand + Decimal(str(body["quantity"]))
    from app.repositories import stock_lot_repository
    stock_lot_repository.save(db, lot)
    m = inventory_service._record_movement(db, lot, "RECEIVE", Decimal(str(body["quantity"])), user.username, body.get("reference"))
    db.commit()
    return StockMovementSchema.model_validate(m, from_attributes=True)


@router.post("/lots/{lot_id}/consume", response_model_exclude_none=True)
def consume(lot_id: int, body: dict, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    m = inventory_service.consume(db, lot_id, Decimal(str(body["quantity"])), user.username, body.get("reference"))
    return StockMovementSchema.model_validate(m, from_attributes=True)


@router.post("/lots/{lot_id}/adjust", response_model_exclude_none=True)
def adjust(lot_id: int, body: dict, db: Annotated[Session, Depends(get_db)], user: AdminOrPurchasing):
    m = inventory_service.adjust(db, lot_id, Decimal(str(body["delta"])), user.username, body.get("reference"))
    return StockMovementSchema.model_validate(m, from_attributes=True)


@router.get("/lots/{lot_id}/movements", response_model_exclude_none=True)
def movements(lot_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [StockMovementSchema.model_validate(m, from_attributes=True) for m in inventory_service.get_movements(db, lot_id)]


@router.get("/low-stock", response_model_exclude_none=True)
def low_stock(db: Annotated[Session, Depends(get_db)], user: CurrentUser, threshold: float | None = Query(None)):
    th = Decimal(str(threshold)) if threshold else None
    return [StockLotSchema.model_validate(l, from_attributes=True) for l in inventory_service.get_low_stock(db, th)]
