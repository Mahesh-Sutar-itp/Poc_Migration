package fr.formcraft.sdk.workflow;

/**
 * Customization Gate 1 (ITK/workflow-rule-handler style): a client-supplied hook that runs
 * around every ChangeRequest status transition. Register an implementation as a Spring bean
 * and it is picked up automatically — no core code changes required.
 *
 * <p>Throw a {@link fr.formcraft.common.exception.FormCraftException} from
 * {@link #beforeTransition} to veto the transition.
 */
public interface ChangeRequestTransitionHandler {

    default void beforeTransition(ChangeRequestTransitionContext context) {
    }

    default void afterTransition(ChangeRequestTransitionContext context) {
    }
}
