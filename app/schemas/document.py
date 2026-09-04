from datetime import datetime

from pydantic import BaseModel
from app.schemas.base import CamelModel


class DocumentSchema(CamelModel):
    """Response schema — excludes content (matches @JsonIgnore on the Java entity)."""
    id: int
    entity_type: str
    entity_id: int
    file_name: str
    content_type: str | None = None
    file_size: int | None = None
    version: int
    uploaded_by: str | None = None
    uploaded_at: datetime
