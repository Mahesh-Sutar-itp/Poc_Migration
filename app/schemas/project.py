from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import BaseSchema

from app.schemas.product import ProductBase
from app.schemas.project_milestone import ProjectMilestoneSchema


class ProjectSchema(BaseSchema):
    id: int
    name: str
    description: str | None = None
    status: str
    owner: str | None = None
    targetLaunchDate: date | None = None
    createdAt: datetime
    products: list[ProductBase] | None = None
    milestones: list[ProjectMilestoneSchema] | None = None


class ProjectCreateRequest(BaseSchema):
    name: str = Field(..., min_length=1)
    description: str | None = None
    owner: str | None = None
    targetLaunchDate: str | None = None


class ProjectUpdateRequest(BaseSchema):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    owner: str | None = None
    targetLaunchDate: str | None = None
