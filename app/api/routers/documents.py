from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import FormCraftException
from app.api.deps import CurrentUser, MutatingUser, _mutating_guard
from app.models.user import User
from app.schemas.document import DocumentSchema
from app.services import document_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model_exclude_none=True)
def list_documents(entityType: str, entityId: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    return [DocumentSchema.model_validate(d, from_attributes=True) for d in document_service.get_for_entity(db, entityType, entityId)]


@router.post("", status_code=201, response_model_exclude_none=True)
def upload(entityType: str = Form(...), entityId: int = Form(...), file: UploadFile = File(...),
           db: Session = Depends(get_db), user: User = Depends(_mutating_guard)):
    content = file.file.read()
    if len(content) > settings.max_upload_size:
        raise FormCraftException(f"File size exceeds maximum of {settings.max_upload_size} bytes")
    doc = document_service.upload(db, entityType, entityId, file.filename, file.content_type, content, user.username)
    return DocumentSchema.model_validate(doc, from_attributes=True)


@router.get("/{doc_id}/download")
def download(doc_id: int, db: Annotated[Session, Depends(get_db)], user: CurrentUser):
    doc = document_service.get_by_id(db, doc_id)
    return Response(content=doc.content, media_type=doc.content_type or "application/octet-stream",
                    headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'})


@router.delete("/{doc_id}", status_code=204)
def delete_doc(doc_id: int, db: Annotated[Session, Depends(get_db)], user: MutatingUser):
    document_service.delete(db, doc_id)
