package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.ReportTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, Long> {

    Optional<ReportTemplate> findByTemplateKey(String templateKey);

    boolean existsByTemplateKey(String templateKey);

    void deleteByTemplateKey(String templateKey);

    List<ReportTemplate> findAllByOrderByIdAsc();
}
