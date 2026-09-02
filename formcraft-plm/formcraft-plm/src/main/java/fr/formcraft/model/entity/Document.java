package fr.formcraft.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A generic file attachment, polymorphically linked to any entity
 * (e.g. entityType="Product", entityId=9) — mirrors the AuditLog polymorphic reference pattern.
 */
@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", length = 150)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    /**
     * Deliberately not annotated with {@code @Lob}: Hibernate maps {@code @Lob byte[]} to
     * Postgres' large-object {@code oid} type, but the schema (and the natural mapping for a
     * plain byte[]) uses {@code bytea}. Keeping this as a plain byte[] column matches the DDL.
     */
    @JsonIgnore
    @Column(name = "content", columnDefinition = "bytea")
    private byte[] content;

    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
