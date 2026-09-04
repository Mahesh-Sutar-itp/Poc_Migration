from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.product import ProductBase
from app.schemas.project_milestone import ProjectMilestoneSchema
from app.schemas.base import CamelModel


class ProjectSchema(CamelModel):
    id: int
    name: str
    description: str | None = None
    status: str
    owner: str | None = None
    target_launch_date: date | None = None
    created_at: datetime
    products: list[ProductBase] | None = None
    milestones: list[ProjectMilestoneSchema] | None = None


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: str | None = None
    owner: str | None = None
    targetLaunchDate: str | None = None


class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    owner: str | None = None
    targetLaunchDate: str | None = None
