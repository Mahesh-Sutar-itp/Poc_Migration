package fr.formcraft.model.enums;

/**
 * Engineering/Formulation Change Request (ECR/ECO) state machine.
 * Valid transitions: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> IMPLEMENTED
 *                                                        \-> REJECTED -> DRAFT
 */
public enum ChangeRequestStatus {
    DRAFT,
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    IMPLEMENTED;

    public boolean canTransitionTo(ChangeRequestStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED;
            case SUBMITTED -> target == UNDER_REVIEW;
            case UNDER_REVIEW -> target == APPROVED || target == REJECTED;
            case APPROVED -> target == IMPLEMENTED;
            case REJECTED -> target == DRAFT;
            case IMPLEMENTED -> false;
        };
    }
}
