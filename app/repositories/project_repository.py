from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project import Project


def find_by_id(db: Session, project_id: int) -> Project | None:
    return db.get(Project, project_id)


def find_all(db: Session, offset: int = 0, limit: int = 20) -> list[Project]:
    return list(
        db.execute(select(Project).order_by(Project.id).offset(offset).limit(limit)).scalars().all()
    )


def count_all(db: Session) -> int:
    return db.execute(select(func.count(Project.id))).scalar_one()


def count_by_status(db: Session, status: str) -> int:
    return db.execute(
        select(func.count(Project.id)).where(Project.status == status)
    ).scalar_one()


def save(db: Session, project: Project) -> Project:
    db.add(project)
    db.flush()
    db.refresh(project)
    return project


def delete(db: Session, project: Project) -> None:
    db.delete(project)
    db.flush()
