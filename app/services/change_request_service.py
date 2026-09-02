import datetime
from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.enums.change_request_status import ChangeRequestStatus
from app.enums.notification_category import NotificationCategory
from app.enums.user_role import UserRole
from app.models.change_request import ChangeRequest
from app.repositories import change_request_repository, product_repository
from app.services import audit_service, notification_service

ENTITY_TYPE = "ChangeRequest"


def get_all(db: Session) -> list[ChangeRequest]:
    return change_request_repository.find_all(db, offset=0, limit=10000)


def get_for_product(db: Session, product_id: int) -> list[ChangeRequest]:
    return change_request_repository.find_by_product_id(db, product_id)


def get_by_id(db: Session, cr_id: int) -> ChangeRequest:
    cr = change_request_repository.find_by_id(db, cr_id)
    if not cr:
        raise EntityNotFoundException("ChangeRequest", cr_id)
    return cr


def create(db: Session, product_id: int, title: str, description: str | None, reason: str | None, impact: str | None, requested_by: str | None) -> ChangeRequest:
    product = product_repository.find_by_id(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)
    cr = ChangeRequest()
    cr.product_id = product_id
    cr.product = product
    cr.title = title
    cr.description = description
    cr.reason = reason
    cr.impact = impact
    cr.requested_by = requested_by
    cr.status = ChangeRequestStatus.DRAFT.value
    saved = change_request_repository.save(db, cr)
    db.commit()
    audit_service.log_action(saved.id, ENTITY_TYPE, "CREATE", f"title={title} product={product.code}", requested_by)
    return saved


def submit(db: Session, cr_id: int) -> ChangeRequest:
    cr = _transition(db, cr_id, ChangeRequestStatus.SUBMITTED)
    cr = _transition(db, cr.id, ChangeRequestStatus.UNDER_REVIEW)
    db.commit()
    notification_service.notify_role(db, UserRole.PLM_MANAGER.value, "Change request awaiting review",
        f'"{cr.title}" is ready for your review.', f"/change-requests/{cr.id}", NotificationCategory.CHANGE_REQUEST.value)
    return cr


def decide(db: Session, cr_id: int, approve: bool, decided_by: str | None, comment: str | None) -> ChangeRequest:
    target = ChangeRequestStatus.APPROVED if approve else ChangeRequestStatus.REJECTED
    cr = _transition(db, cr_id, target)
    cr.decided_by = decided_by
    cr.decided_at = datetime.datetime.utcnow()
    cr.decision_comment = comment
    saved = change_request_repository.save(db, cr)
    db.commit()
    audit_service.log_action(saved.id, ENTITY_TYPE, "APPROVE" if approve else "REJECT", f"by={decided_by} comment={comment}", decided_by)
    if saved.requested_by:
        status_text = "approved" if approve else "rejected"
        notification_service.notify_user(db, saved.requested_by, f"Change request {status_text}",
            f'"{saved.title}" was {status_text}.', f"/change-requests/{saved.id}", NotificationCategory.CHANGE_REQUEST.value)
    return saved


def implement(db: Session, cr_id: int) -> ChangeRequest:
    cr = _transition(db, cr_id, ChangeRequestStatus.IMPLEMENTED)
    db.commit()
    audit_service.log_action(cr.id, ENTITY_TYPE, "IMPLEMENT", f"product={cr.product.code}" if cr.product else "")
    return cr


def _transition(db: Session, cr_id: int, target: ChangeRequestStatus) -> ChangeRequest:
    cr = get_by_id(db, cr_id)
    current = ChangeRequestStatus(cr.status)
    if not current.can_transition_to(target):
        raise FormCraftException(f"Invalid change request transition: {current.value} -> {target.value}")
    cr.status = target.value
    return change_request_repository.save(db, cr)
