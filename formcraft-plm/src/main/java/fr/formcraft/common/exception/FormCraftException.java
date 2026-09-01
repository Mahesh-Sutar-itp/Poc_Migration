package fr.formcraft.common.exception;

/**
 * Primary runtime exception for FormCraft PLM business logic failures.
 * Mirrors beCPG's BeCPGException pattern.
 */
public class FormCraftException extends RuntimeException {

    public FormCraftException(String message) {
        super(message);
    }

    public FormCraftException(String message, Throwable cause) {
        super(message, cause);
    }
}
