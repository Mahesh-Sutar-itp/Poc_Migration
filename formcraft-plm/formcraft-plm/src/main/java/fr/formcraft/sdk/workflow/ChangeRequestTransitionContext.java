package fr.formcraft.sdk.workflow;

import fr.formcraft.model.entity.ChangeRequest;
import fr.formcraft.model.enums.ChangeRequestStatus;

/**
 * Customization Gate 1 — the payload handed to every {@link ChangeRequestTransitionHandler}
 * around a ChangeRequest status transition (Teamcenter-style workflow rule handler).
 */
public record ChangeRequestTransitionContext(
        ChangeRequest changeRequest,
        ChangeRequestStatus fromStatus,
        ChangeRequestStatus toStatus) {
}
