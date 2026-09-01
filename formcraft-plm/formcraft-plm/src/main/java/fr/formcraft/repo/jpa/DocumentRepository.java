package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("SELECT d FROM Document d WHERE d.entityType = :entityType AND d.entityId = :entityId ORDER BY d.uploadedAt DESC")
    List<Document> findByEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);
}
