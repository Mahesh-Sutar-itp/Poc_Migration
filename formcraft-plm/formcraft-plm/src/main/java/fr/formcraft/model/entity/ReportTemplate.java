package fr.formcraft.model.entity;

import fr.formcraft.model.enums.TargetEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Customization Gate 5 (RAC Report Builder-style): a named, declarative field
 * projection over a target entity. Registering one of these is a config-time
 * action — no Java code or redeploy required, completing the templating layer
 * {@code RepoConsts.REPORT_*} constants originally hinted at but never wired up.
 */
@Entity
@Table(name = "report_templates")
@Getter
@Setter
@NoArgsConstructor
public class ReportTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_key", nullable = false, unique = true, length = 100)
    private String templateKey;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_entity", nullable = false, length = 30)
    private TargetEntity targetEntity;

    /** Ordered list of field names to project; unknown names fall back to customAttributes lookup. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private List<String> fields = new ArrayList<>();

    /** field name -> display label; falls back to the raw field name when absent. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private Map<String, String> labels = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
