package fr.formcraft.repo.document;

import fr.formcraft.model.entity.Document;

import java.util.List;

public interface DocumentService {

    List<Document> getForEntity(String entityType, Long entityId);

    Document getById(Long id);

    Document upload(String entityType, Long entityId, String fileName, String contentType,
                     byte[] content, String uploadedBy);

    void delete(Long id);
}
