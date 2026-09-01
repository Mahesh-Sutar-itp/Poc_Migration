package fr.formcraft.model.enums;

/** Lifecycle state of a non-conformance record. */
public enum NcStatus {
    OPEN,
    IN_PROGRESS,
    CLOSED;

    public boolean canTransitionTo(NcStatus target) {
        return switch (this) {
            case OPEN -> target == IN_PROGRESS;
            case IN_PROGRESS -> target == CLOSED || target == OPEN;
            case CLOSED -> false;
        };
    }
}
