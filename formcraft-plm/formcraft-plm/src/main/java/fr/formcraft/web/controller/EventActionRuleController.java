package fr.formcraft.web.controller;

import fr.formcraft.model.entity.EventActionRule;
import fr.formcraft.model.enums.EventActionType;
import fr.formcraft.model.enums.EventType;
import fr.formcraft.model.enums.NotificationCategory;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.sdk.events.EventActionRuleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-facing endpoint for Customization Gate 3 (Event Manager-style): register an
 * event -&gt; notification rule without a schema migration or a Java code change.
 */
@RestController
@RequestMapping("/event-action-rules")
public class EventActionRuleController {

    private final EventActionRuleService eventActionRuleService;

    @Autowired
    public EventActionRuleController(EventActionRuleService eventActionRuleService) {
        this.eventActionRuleService = eventActionRuleService;
    }

    @GetMapping
    public ResponseEntity<List<EventActionRule>> list() {
        return ResponseEntity.ok(eventActionRuleService.listRules());
    }

    @PostMapping
    public ResponseEntity<EventActionRule> create(@Valid @RequestBody CreateEventActionRuleRequest request) {
        EventActionRule rule = new EventActionRule();
        rule.setEventType(request.eventType());
        rule.setConditionProductType(request.conditionProductType());
        rule.setActionType(request.actionType());
        rule.setTargetRole(request.targetRole());
        rule.setNotificationTitle(request.notificationTitle());
        rule.setMessageTemplate(request.messageTemplate());
        rule.setNotificationCategory(request.notificationCategory());

        return ResponseEntity.status(HttpStatus.CREATED).body(eventActionRuleService.createRule(rule));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<EventActionRule> setEnabled(@PathVariable Long id, @RequestBody UpdateEnabledRequest request) {
        return ResponseEntity.ok(eventActionRuleService.setEnabled(id, request.enabled()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        eventActionRuleService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateEventActionRuleRequest(
            @NotNull EventType eventType,
            ProductType conditionProductType,
            @NotNull EventActionType actionType,
            UserRole targetRole,
            @NotBlank String notificationTitle,
            @NotBlank String messageTemplate,
            @NotNull NotificationCategory notificationCategory
    ) {}

    public record UpdateEnabledRequest(boolean enabled) {}
}
