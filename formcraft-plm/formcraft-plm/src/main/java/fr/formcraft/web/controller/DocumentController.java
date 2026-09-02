package fr.formcraft.web.controller;

import fr.formcraft.model.entity.Document;
import fr.formcraft.repo.document.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService documentService;

    @Autowired
    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<List<Document>> list(@RequestParam String entityType, @RequestParam Long entityId) {
        return ResponseEntity.ok(documentService.getForEntity(entityType, entityId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> upload(@RequestParam String entityType,
                                            @RequestParam Long entityId,
                                            @RequestParam("file") MultipartFile file,
                                            Authentication auth) {
        try {
            Document uploaded = documentService.upload(entityType, entityId, file.getOriginalFilename(),
                    file.getContentType(), file.getBytes(), auth.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(uploaded);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read uploaded file", e);
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        Document document = documentService.getById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        document.getContentType() != null ? document.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(document.getFileName()).build().toString())
                .body(document.getContent());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
