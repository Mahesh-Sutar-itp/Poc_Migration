from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PageResponse(BaseModel, Generic[T]):
    content: list[T]
    totalElements: int
    totalPages: int
    number: int
    size: int

    model_config = ConfigDict(from_attributes=True)
