package fr.formcraft.sdk.events;

import fr.formcraft.model.entity.Product;

/**
 * Customization Gate 3 — the payload handed to {@link EventActionRuleService#fire}
 * when a domain event occurs.
 */
public record EventContext(Product product, String title, String detail, String link, String initiatingUsername) {
}
