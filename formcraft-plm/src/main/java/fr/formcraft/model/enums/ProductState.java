package fr.formcraft.model.enums;

/**
 * Product lifecycle state machine states.
 * Valid transitions: DRAFT -> IN_VALIDATION -> VALIDATED -> ARCHIVED
 */
public enum ProductState {
    DRAFT,
    IN_VALIDATION,
    VALIDATED,
    ARCHIVED;

    public boolean canTransitionTo(ProductState target) {
        return switch (this) {
            case DRAFT         -> target == IN_VALIDATION;
            case IN_VALIDATION -> target == VALIDATED || target == DRAFT;
            case VALIDATED     -> target == ARCHIVED;
            case ARCHIVED      -> false;
        };
    }
}
