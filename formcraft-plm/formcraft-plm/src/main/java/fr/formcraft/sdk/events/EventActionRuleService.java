package fr.formcraft.sdk.events;

import fr.formcraft.model.entity.EventActionRule;
import fr.formcraft.model.enums.EventType;

import java.util.List;

/**
 * Customization Gate 3 (Event Manager-style): lets a client register event -&gt; action
 * rules and have them dispatched automatically, without a schema migration or a core
 * code change.
 */
public interface EventActionRuleService {

    List<EventActionRule> listRules();

    EventActionRule createRule(EventActionRule rule);

    EventActionRule setEnabled(Long id, boolean enabled);

    void deleteRule(Long id);

    /** Dispatches every enabled rule registered for {@code type} whose condition matches. */
    void fire(EventType type, EventContext context);
}
