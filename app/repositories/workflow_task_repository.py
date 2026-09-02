from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workflow_task import WorkflowTask


def find_by_id(db: Session, task_id: int) -> WorkflowTask | None:
    return db.get(WorkflowTask, task_id)


def find_by_product_id(db: Session, product_id: int) -> list[WorkflowTask]:
    return list(
        db.execute(
            select(WorkflowTask).where(WorkflowTask.product_id == product_id)
        ).scalars().all()
    )


def find_by_assignee_and_status(db: Session, assignee: str, status: str) -> list[WorkflowTask]:
    return list(
        db.execute(
            select(WorkflowTask).where(
                WorkflowTask.assignee == assignee, WorkflowTask.status == status
            )
        ).scalars().all()
    )


def find_by_product_id_and_status(db: Session, product_id: int, status: str) -> list[WorkflowTask]:
    return list(
        db.execute(
            select(WorkflowTask).where(
                WorkflowTask.product_id == product_id, WorkflowTask.status == status
            )
        ).scalars().all()
    )


def save(db: Session, task: WorkflowTask) -> WorkflowTask:
    db.add(task)
    db.flush()
    db.refresh(task)
    return task
