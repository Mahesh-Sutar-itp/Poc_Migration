import datetime
from sqlalchemy.orm import Session
from app.core.constants import AUDIT_DELETE
from app.core.exceptions import EntityNotFoundException, FormCraftException
from app.enums.milestone_status import MilestoneStatus
from app.enums.project_status import ProjectStatus
from app.models.project import Project
from app.models.project_milestone import ProjectMilestone
from app.repositories import product_repository, project_milestone_repository, project_repository
from app.services import audit_service


def find_all(db: Session, offset: int = 0, limit: int = 20) -> tuple[list[Project], int]:
    items = project_repository.find_all(db, offset=offset, limit=limit)
    total = project_repository.count_all(db)
    return items, total


def get_by_id(db: Session, project_id: int) -> Project:
    p = project_repository.find_by_id(db, project_id)
    if not p:
        raise EntityNotFoundException("Project", project_id)
    return p


def create_project(db: Session, name: str, description: str | None, owner: str | None, target_launch_date: str | None) -> Project:
    project = Project()
    project.name = name
    project.description = description
    project.owner = owner
    project.status = ProjectStatus.PLANNING.value
    if target_launch_date:
        project.target_launch_date = datetime.date.fromisoformat(target_launch_date)
    saved = project_repository.save(db, project)
    db.commit()
    return saved


def update_status(db: Session, project_id: int, status: str) -> Project:
    project = get_by_id(db, project_id)
    project.status = status
    saved = project_repository.save(db, project)
    db.commit()
    return saved


def link_product(db: Session, project_id: int, product_id: int) -> None:
    project = get_by_id(db, project_id)
    product = product_repository.find_by_id(db, product_id)
    if not product:
        raise EntityNotFoundException("Product", product_id)
    if not any(p.id == product_id for p in project.products):
        project.products.append(product)
        project_repository.save(db, project)
        db.commit()


def unlink_product(db: Session, project_id: int, product_id: int) -> None:
    project = get_by_id(db, project_id)
    project.products = [p for p in project.products if p.id != product_id]
    project_repository.save(db, project)
    db.commit()


def add_milestone(db: Session, project_id: int, name: str, gate_number: int, due_date: str | None) -> ProjectMilestone:
    project = get_by_id(db, project_id)
    ms = ProjectMilestone()
    ms.project_id = project_id
    ms.project = project
    ms.name = name
    ms.gate_number = gate_number
    ms.status = MilestoneStatus.PENDING.value
    if due_date:
        ms.due_date = datetime.date.fromisoformat(due_date)
    saved = project_milestone_repository.save(db, ms)
    db.commit()
    return saved


def update_milestone_status(db: Session, project_id: int, milestone_id: int, status: str) -> ProjectMilestone:
    ms = project_milestone_repository.find_by_id(db, milestone_id)
    if not ms:
        raise EntityNotFoundException("ProjectMilestone", milestone_id)
    if ms.project_id != project_id:
        raise FormCraftException(f"Milestone does not belong to project {project_id}")
    ms.status = status
    if status == MilestoneStatus.DONE.value:
        ms.completed_at = datetime.datetime.now(datetime.UTC)
    else:
        ms.completed_at = None
    saved = project_milestone_repository.save(db, ms)
    db.commit()
    return saved


def delete_project(db: Session, project_id: int) -> None:
    project = get_by_id(db, project_id)
    if project.status not in (ProjectStatus.PLANNING.value, ProjectStatus.CANCELLED.value):
        raise FormCraftException(f"Cannot delete project in status {project.status} — only PLANNING or CANCELLED projects can be deleted")
    project_repository.delete(db, project)
    db.commit()
    audit_service.log_action(project_id, "Project", AUDIT_DELETE, f"DELETED name={project.name}")
