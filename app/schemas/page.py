from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema

T = TypeVar("T")


class PageResponse(BaseModel, Generic[T]):
    content: list[T]
    totalElements: int
    totalPages: int
    number: int
    size: int
