package fr.formcraft.model.enums;

/**
 * Customization Gate 3 (Event Manager-style): the closed catalog of domain events
 * this application raises. Each corresponds to a real call site that previously
 * fired a hardcoded notification directly.
 */
public enum EventType {
    CHANGE_REQUEST_SUBMITTED,
    CHANGE_REQUEST_APPROVED,
    CHANGE_REQUEST_REJECTED,
    NON_CONFORMANCE_OPENED,
    INVENTORY_LOW_STOCK
}
