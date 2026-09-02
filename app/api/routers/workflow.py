from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, AdminOrPLM
from app.schemas.product import ProductSchema
from app.schemas.workflow_task import WorkflowTaskSchema
from app.services import workflow_service

router = APIRouter(prefix="/api/products/{product_id}/workflow", tags=["workflow"])


def _task_schema(t):
    return WorkflowTaskSchema(id=t.id, productId=t.product_id, taskName=t.task_name, description=t.description,
                              assignee=t.assignee, status=t.status, dueDate=t.due_date,
                              completedAt=t.completed_at, createdAt=t.created_at)


@router.post("/submit", response_model_exclude_none=True)
def submit(product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPLM,
           assignee: str | None = Query(None)):
    p = workflow_service.submit_for_validation(db, product_id, assignee, user.username)
    return ProductSchema.model_validate(p, from_attributes=True)


@router.post("/approve", response_model_exclude_none=True)
def approve(product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPLM):
    return ProductSchema.model_validate(workflow_service.approve(db, product_id, user.username), from_attributes=True)


@router.post("/reject", response_model_exclude_none=True)
def reject(product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPLM,
           reason: str = Query(...)):
    return ProductSchema.model_validate(workflow_service.reject(db, product_id, reason, user.username), from_attributes=True)


@router.post("/archive", response_model_exclude_none=True)
def archive(product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPLM):
    return ProductSchema.model_validate(workflow_service.archive(db, product_id, user.username), from_attributes=True)


@router.post("/transition", response_model_exclude_none=True)
def transition(product_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPLM,
               targetState: str = Query(...), comment: str | None = Query(None)):
    return ProductSchema.model_validate(workflow_service.transition_state(db, product_id, targetState, user.username), from_attributes=True)


@router.get("/tasks", response_model_exclude_none=True)
def tasks(product_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [_task_schema(t) for t in workflow_service.get_tasks_for_product(db, product_id)]


@router.post("/tasks/{task_id}/complete", response_model_exclude_none=True)
def complete_task(product_id: int, task_id: int, db: Annotated[Session, Depends(get_db)], user: AdminOrPLM):
    return _task_schema(workflow_service.complete_task(db, task_id))
