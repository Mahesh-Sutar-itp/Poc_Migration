from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductBase
from app.schemas.project_milestone import ProjectMilestoneSchema


class ProjectSchema(BaseModel):
    id: int
    name: str
    description: str | None = None
    status: str
    owner: str | None = None
    targetLaunchDate: str | None = None
    createdAt: datetime
    products: list[ProductBase] | None = None
    milestones: list[ProjectMilestoneSchema] | None = None

    model_config = ConfigDict(from_attributes=True)


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
