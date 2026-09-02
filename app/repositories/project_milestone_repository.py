from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project_milestone import ProjectMilestone


def find_by_id(db: Session, milestone_id: int) -> ProjectMilestone | None:
    return db.get(ProjectMilestone, milestone_id)


def find_by_project_id(db: Session, project_id: int) -> list[ProjectMilestone]:
    return list(
        db.execute(
            select(ProjectMilestone).where(ProjectMilestone.project_id == project_id)
            .order_by(ProjectMilestone.gate_number.asc())
        ).scalars().all()
    )


def save(db: Session, ms: ProjectMilestone) -> ProjectMilestone:
    db.add(ms)
    db.flush()
    db.refresh(ms)
    return ms
