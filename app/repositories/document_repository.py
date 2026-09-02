from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document


def find_by_id(db: Session, doc_id: int) -> Document | None:
    return db.get(Document, doc_id)


def find_by_entity(db: Session, entity_type: str, entity_id: int) -> list[Document]:
    return list(
        db.execute(
            select(Document)
            .where(Document.entity_type == entity_type, Document.entity_id == entity_id)
            .order_by(Document.uploaded_at.desc())
        ).scalars().all()
    )


def save(db: Session, doc: Document) -> Document:
    db.add(doc)
    db.flush()
    db.refresh(doc)
    return doc


def delete(db: Session, doc: Document) -> None:
    db.delete(doc)
    db.flush()
