import datetime
import logging

from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.enums.product_state import ProductState
from app.enums.task_status import TaskStatus
from app.models.product import Product
from app.models.workflow_task import WorkflowTask
from app.repositories import product_repository, workflow_task_repository
from app.services import audit_service

logger = logging.getLogger(__name__)


def transition_state(db: Session, product_id: int, target_state: str, performed_by: str | None = None) -> Product:
    product = _get_product(db, product_id)
    from_state = ProductState(product.state)
    target = ProductState(target_state)

    if not from_state.can_transition_to(target):
        raise FormCraftException(f"Invalid state transition: {from_state.value} -> {target.value} for product {product_id}")

    product.state = target.value
    saved = product_repository.save(db, product)
    db.commit()
    audit_service.log_workflow_transition(product_id, from_state.value, target.value, performed_by)
    return saved


def submit_for_validation(db: Session, product_id: int, assignee: str | None = None, performed_by: str | None = None) -> Product:
    product = transition_state(db, product_id, ProductState.IN_VALIDATION.value, performed_by)
    _cancel_pending_tasks(db, product_id)
    _create_task(db, product, "Review Product Specification", "Review and validate the product specification sheet", assignee, 5)
    _create_task(db, product, "Allergen Compliance Check", "Verify allergen declarations are complete and accurate", assignee, 3)
    db.commit()
    return product


def approve(db: Session, product_id: int, performed_by: str | None = None) -> Product:
    _complete_pending_tasks(db, product_id)
    return transition_state(db, product_id, ProductState.VALIDATED.value, performed_by)


def reject(db: Session, product_id: int, reason: str | None = None, performed_by: str | None = None) -> Product:
    _cancel_pending_tasks(db, product_id)
    product = transition_state(db, product_id, ProductState.DRAFT.value, performed_by)
    task = WorkflowTask()
    task.product_id = product_id
    task.product = product
    task.task_name = "Address Rejection Feedback"
    task.description = f"Product was rejected. Reason: {reason}"
    task.status = TaskStatus.PENDING.value
    workflow_task_repository.save(db, task)
    db.commit()
    return product


def archive(db: Session, product_id: int, performed_by: str | None = None) -> Product:
    return transition_state(db, product_id, ProductState.ARCHIVED.value, performed_by)


def get_tasks_for_product(db: Session, product_id: int) -> list[WorkflowTask]:
    return workflow_task_repository.find_by_product_id(db, product_id)


def get_tasks_for_user(db: Session, username: str) -> list[WorkflowTask]:
    return workflow_task_repository.find_by_assignee_and_status(db, username, TaskStatus.PENDING.value)


def complete_task(db: Session, task_id: int) -> WorkflowTask:
    task = workflow_task_repository.find_by_id(db, task_id)
    if not task:
        raise EntityNotFoundException("WorkflowTask", task_id)
    task.status = TaskStatus.COMPLETED.value
    task.completed_at = datetime.datetime.now(datetime.UTC)
    saved = workflow_task_repository.save(db, task)
    db.commit()
    return saved


def _create_task(db: Session, product: Product, name: str, description: str, assignee: str | None, due_days: int):
    task = WorkflowTask()
    task.product_id = product.id
    task.product = product
    task.task_name = name
    task.description = description
    task.assignee = assignee
    task.status = TaskStatus.PENDING.value
    task.due_date = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=due_days)
    workflow_task_repository.save(db, task)


def _cancel_pending_tasks(db: Session, product_id: int):
    tasks = workflow_task_repository.find_by_product_id_and_status(db, product_id, TaskStatus.PENDING.value)
    for t in tasks:
        t.status = TaskStatus.CANCELLED.value
    db.flush()


def _complete_pending_tasks(db: Session, product_id: int):
    tasks = workflow_task_repository.find_by_product_id_and_status(db, product_id, TaskStatus.PENDING.value)
    for t in tasks:
        t.status = TaskStatus.COMPLETED.value
        t.completed_at = datetime.datetime.now(datetime.UTC)
    db.flush()


def _get_product(db: Session, product_id: int) -> Product:
    p = product_repository.find_by_id(db, product_id)
    if not p:
        raise EntityNotFoundException("Product", product_id)
    return p
