from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser
from app.schemas.workflow_task import WorkflowTaskSchema
from app.services import workflow_service

router = APIRouter(prefix="/api/workflow", tags=["workflow-tasks"])


@router.get("/my-tasks", response_model_exclude_none=True)
def my_tasks(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    items = workflow_service.get_tasks_for_user(db, user.username)
    return [WorkflowTaskSchema(id=t.id, productId=t.product_id, taskName=t.task_name, description=t.description,
                               assignee=t.assignee, status=t.status, dueDate=t.due_date,
                               completedAt=t.completed_at, createdAt=t.created_at) for t in items]
