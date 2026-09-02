package fr.formcraft.common.exception;

/**
 * Thrown when the formulation chain encounters an unrecoverable error.
 */
public class FormulationException extends FormCraftException {

    private final Long productId;
    private final String chainId;

    public FormulationException(String message, Long productId, String chainId) {
        super(message);
        this.productId = productId;
        this.chainId = chainId;
    }

    public FormulationException(String message, Long productId, String chainId, Throwable cause) {
        super(message, cause);
        this.productId = productId;
        this.chainId = chainId;
    }

    public Long getProductId() {
        return productId;
    }

    public String getChainId() {
        return chainId;
    }
}
