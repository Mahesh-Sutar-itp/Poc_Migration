package fr.formcraft.model.entity;

import fr.formcraft.model.enums.RuleEffect;
import fr.formcraft.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Customization Gate 4 (Access Manager-style): a declarative role/action rule
 * layered on top of {@code SecurityConfig}'s static matcher chain, evaluated by
 * {@link fr.formcraft.security.AccessRulePermissionEvaluator}. Registering one of
 * these is a config-time action — no schema migration or Java code required.
 */
@Entity
@Table(name = "access_rules", uniqueConstraints = @UniqueConstraint(columnNames = {"role", "action_key"}))
@Getter
@Setter
@NoArgsConstructor
public class AccessRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    /** A flat key identifying a policy-checked action, e.g. "CHANGE_REQUEST_DECIDE". */
    @Column(name = "action_key", nullable = false, length = 100)
    private String actionKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RuleEffect effect;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
