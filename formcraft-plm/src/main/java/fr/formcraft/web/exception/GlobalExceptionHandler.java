package fr.formcraft.web.exception;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.common.exception.FormulationException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.stream.Collectors;

/** Global exception handler — translates domain exceptions to HTTP responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Log logger = LogFactory.getLog(GlobalExceptionHandler.class);

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleEntityNotFound(EntityNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setProperty("entityType", ex.getEntityType());
        detail.setProperty("entityId", ex.getEntityId());
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }

    @ExceptionHandler(FormulationException.class)
    public ProblemDetail handleFormulationError(FormulationException ex) {
        logger.error("Formulation failed for product=" + ex.getProductId(), ex);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        detail.setProperty("productId", ex.getProductId());
        detail.setProperty("chainId", ex.getChainId());
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }

    @ExceptionHandler(FormCraftException.class)
    public ProblemDetail handleFormCraftException(FormCraftException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));

        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, errors);
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        logger.error("Unhandled exception: " + ex.getMessage(), ex);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }
}
