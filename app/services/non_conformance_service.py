import datetime
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.enums.capa_status import CapaStatus
from app.enums.nc_status import NcStatus
from app.enums.notification_category import NotificationCategory
from app.enums.user_role import UserRole
from app.models.corrective_action import CorrectiveAction
from app.models.non_conformance import NonConformance
from app.repositories import corrective_action_repository, non_conformance_repository, product_repository, quality_check_repository
from app.services import notification_service


def get_all(db: Session, offset: int = 0, limit: int = 20) -> tuple[list[NonConformance], int]:
    items = non_conformance_repository.find_all(db, offset=offset, limit=limit)
    total = non_conformance_repository.count_all(db)
    return items, total


def get_for_product(db: Session, product_id: int) -> list[NonConformance]:
    return non_conformance_repository.find_by_product_id(db, product_id)


def get_by_id(db: Session, nc_id: int) -> NonConformance:
    nc = non_conformance_repository.find_by_id(db, nc_id)
    if not nc:
        raise EntityNotFoundException("NonConformance", nc_id)
    return nc


def raise_nc(db: Session, product_id: int, title: str, description: str | None, severity: str,
             raised_by: str | None, quality_check_id: int | None = None) -> NonConformance:
    product = product_repository.find_by_id(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)
    nc = NonConformance()
    nc.product_id = product_id
    nc.product = product
    nc.title = title
    nc.description = description
    nc.severity = severity
    nc.raised_by = raised_by
    nc.status = NcStatus.OPEN.value
    if quality_check_id:
        qc = quality_check_repository.find_by_id(db, quality_check_id)
        if not qc:
            raise EntityNotFoundException("QualityCheck", quality_check_id)
        nc.quality_check_id = quality_check_id
    saved = non_conformance_repository.save(db, nc)
    db.commit()
    notification_service.notify_role(db, UserRole.QUALITY_MANAGER.value, f"Non-conformance raised: {severity}",
        f'"{title}" raised against {product.name}', f"/non-conformances/{saved.id}", NotificationCategory.QUALITY.value)
    return saved


def transition_status(db: Session, nc_id: int, target: str) -> NonConformance:
    nc = get_by_id(db, nc_id)
    current = NcStatus(nc.status)
    target_status = NcStatus(target)
    if not current.can_transition_to(target_status):
        raise FormCraftException(f"Invalid non-conformance transition: {current.value} -> {target_status.value}")
    if target_status == NcStatus.CLOSED:
        return _do_close(db, nc)
    nc.status = target_status.value
    saved = non_conformance_repository.save(db, nc)
    db.commit()
    return saved


def _do_close(db: Session, nc: NonConformance) -> NonConformance:
    open_count = corrective_action_repository.count_by_nc_and_status(db, nc.id, CapaStatus.OPEN.value)
    if open_count > 0:
        raise FormCraftException(f"Cannot close non-conformance: {open_count} corrective action(s) are still open")
    nc.status = NcStatus.CLOSED.value
    nc.closed_at = datetime.datetime.utcnow()
    saved = non_conformance_repository.save(db, nc)
    db.commit()
    return saved


def add_corrective_action(db: Session, nc_id: int, description: str, owner: str | None, due_date: str | None) -> CorrectiveAction:
    nc = get_by_id(db, nc_id)
    if nc.status == NcStatus.CLOSED.value:
        raise FormCraftException("Cannot add a corrective action to a closed non-conformance")
    action = CorrectiveAction()
    action.non_conformance_id = nc_id
    action.non_conformance = nc
    action.description = description
    action.owner = owner
    if due_date:
        action.due_date = datetime.date.fromisoformat(due_date)
    action.status = CapaStatus.OPEN.value
    saved = corrective_action_repository.save(db, action)
    db.commit()
    return saved


def close_corrective_action(db: Session, nc_id: int, action_id: int) -> CorrectiveAction:
    action = corrective_action_repository.find_by_id(db, action_id)
    if not action:
        raise EntityNotFoundException("CorrectiveAction", action_id)
    if action.non_conformance_id != nc_id:
        raise FormCraftException(f"Corrective action does not belong to non-conformance {nc_id}")
    action.status = CapaStatus.DONE.value
    action.closed_at = datetime.datetime.utcnow()
    saved = corrective_action_repository.save(db, action)
    db.commit()
    return saved


def get_corrective_actions(db: Session, nc_id: int) -> list[CorrectiveAction]:
    return corrective_action_repository.find_by_non_conformance_id(db, nc_id)
