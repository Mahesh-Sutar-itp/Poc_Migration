package fr.formcraft.repo.document.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.model.entity.Document;
import fr.formcraft.repo.document.DocumentService;
import fr.formcraft.repo.jpa.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("documentService")
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;

    @Autowired
    public DocumentServiceImpl(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Document> getForEntity(String entityType, Long entityId) {
        return documentRepository.findByEntity(entityType, entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public Document getById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Document", id));
    }

    @Override
    @Transactional
    public Document upload(String entityType, Long entityId, String fileName, String contentType,
                            byte[] content, String uploadedBy) {
        Document document = new Document();
        document.setEntityType(entityType);
        document.setEntityId(entityId);
        document.setFileName(fileName);
        document.setContentType(contentType);
        document.setFileSize((long) content.length);
        document.setContent(content);
        document.setUploadedBy(uploadedBy);
        return documentRepository.save(document);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Document document = getById(id);
        documentRepository.delete(document);
    }
}
