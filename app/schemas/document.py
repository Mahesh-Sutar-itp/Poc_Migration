from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentSchema(BaseModel):
    """Response schema — excludes content (matches @JsonIgnore on the Java entity)."""
    id: int
    entityType: str
    entityId: int
    fileName: str
    contentType: str | None = None
    fileSize: int | None = None
    version: int
    uploadedBy: str | None = None
    uploadedAt: datetime

    model_config = ConfigDict(from_attributes=True)
