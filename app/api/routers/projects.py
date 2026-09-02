from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import CurrentUser, MutatingUser
from app.schemas.project import ProjectSchema, ProjectCreateRequest, ProjectUpdateRequest
from app.schemas.project_milestone import ProjectMilestoneSchema, ProjectMilestoneCreateRequest
from app.services import project_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model_exclude_none=True)
def list_projects(db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    items, _ = project_service.find_all(db, offset=0, limit=10000)
    return [ProjectSchema.model_validate(p, from_attributes=True) for p in items]


@router.get("/{project_id}", response_model_exclude_none=True)
def get_project(project_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return ProjectSchema.model_validate(project_service.get_by_id(db, project_id), from_attributes=True)


@router.post("", status_code=201, response_model_exclude_none=True)
def create_project(body: ProjectCreateRequest, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return ProjectSchema.model_validate(
        project_service.create_project(db, body.name, body.description, body.owner, body.targetLaunchDate), from_attributes=True)


@router.put("/{project_id}/status", response_model_exclude_none=True)
def update_status(project_id: int, status: str, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return ProjectSchema.model_validate(project_service.update_status(db, project_id, status), from_attributes=True)


@router.post("/{project_id}/products/{product_id}", status_code=204)
def link_product(project_id: int, product_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    project_service.link_product(db, project_id, product_id)


@router.delete("/{project_id}/products/{product_id}", status_code=204)
def unlink_product(project_id: int, product_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    project_service.unlink_product(db, project_id, product_id)


@router.post("/{project_id}/milestones", status_code=201, response_model_exclude_none=True)
def add_milestone(project_id: int, body: ProjectMilestoneCreateRequest, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return ProjectMilestoneSchema.model_validate(
        project_service.add_milestone(db, project_id, body.name, body.gateNumber, body.dueDate), from_attributes=True)


@router.put("/{project_id}/milestones/{milestone_id}/status", response_model_exclude_none=True)
def update_milestone(project_id: int, milestone_id: int, status: str, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    return ProjectMilestoneSchema.model_validate(
        project_service.update_milestone_status(db, project_id, milestone_id, status), from_attributes=True)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    project_service.delete_project(db, project_id)
