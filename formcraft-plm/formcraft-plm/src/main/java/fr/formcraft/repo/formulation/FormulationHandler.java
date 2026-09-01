package fr.formcraft.repo.formulation;

/**
 * A single step in the formulation chain (Chain of Responsibility pattern).
 * Mirrors beCPG's FormulationHandler interface.
 */
public interface FormulationHandler {

    /**
     * Execute this handler's logic on the given context,
     * then delegate to the next handler in the chain.
     *
     * @param context the mutable formulation context shared across the chain
     */
    void handle(FormulationContext context);

    /**
     * Set the next handler in the chain.
     *
     * @param next the next handler to call after this one
     * @return this handler, for fluent chaining
     */
    FormulationHandler setNext(FormulationHandler next);

    /**
     * Human-readable name of this handler for logging and debugging.
     *
     * @return handler name
     */
    String getHandlerName();
}
