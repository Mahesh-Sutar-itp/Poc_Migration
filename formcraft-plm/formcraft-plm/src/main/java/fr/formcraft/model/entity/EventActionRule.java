package fr.formcraft.model.entity;

import fr.formcraft.model.enums.EventActionType;
import fr.formcraft.model.enums.EventType;
import fr.formcraft.model.enums.NotificationCategory;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Customization Gate 3 (Event Manager-style): a declarative binding of a domain
 * event to a notification action. Registering one of these is a config-time
 * action — no Java code or redeploy required.
 */
@Entity
@Table(name = "event_action_rules")
@Getter
@Setter
@NoArgsConstructor
public class EventActionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private EventType eventType;

    /** Restrict this rule to one product type; null applies it to every product. */
    @Enumerated(EnumType.STRING)
    @Column(name = "condition_product_type", length = 30)
    private ProductType conditionProductType;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 30)
    private EventActionType actionType;

    /** Required when actionType is NOTIFY_ROLE; ignored for NOTIFY_INITIATING_USER. */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", length = 30)
    private UserRole targetRole;

    @Column(name = "notification_title", nullable = false, length = 150)
    private String notificationTitle;

    /** Supports {title} and {detail} placeholders, substituted from the firing EventContext. */
    @Column(name = "message_template", nullable = false, length = 500)
    private String messageTemplate;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_category", nullable = false, length = 20)
    private NotificationCategory notificationCategory;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
