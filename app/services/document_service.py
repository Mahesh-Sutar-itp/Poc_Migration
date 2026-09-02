from sqlalchemy.orm import Session
from app.core.exceptions import EntityNotFoundException
from app.models.document import Document
from app.repositories import document_repository


def get_for_entity(db: Session, entity_type: str, entity_id: int) -> list[Document]:
    return document_repository.find_by_entity(db, entity_type, entity_id)


def get_by_id(db: Session, doc_id: int) -> Document:
    doc = document_repository.find_by_id(db, doc_id)
    if not doc:
        raise EntityNotFoundException("Document", doc_id)
    return doc


def upload(db: Session, entity_type: str, entity_id: int, file_name: str, content_type: str, content: bytes, uploaded_by: str | None) -> Document:
    doc = Document()
    doc.entity_type = entity_type
    doc.entity_id = entity_id
    doc.file_name = file_name
    doc.content_type = content_type
    doc.file_size = len(content)
    doc.content = content
    doc.uploaded_by = uploaded_by
    saved = document_repository.save(db, doc)
    db.commit()
    return saved


def delete(db: Session, doc_id: int) -> None:
    doc = get_by_id(db, doc_id)
    document_repository.delete(db, doc)
    db.commit()
