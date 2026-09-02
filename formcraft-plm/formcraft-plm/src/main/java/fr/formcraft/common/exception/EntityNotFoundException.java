package fr.formcraft.common.exception;

/**
 * Thrown when a requested entity is not found in the repository.
 */
public class EntityNotFoundException extends FormCraftException {

    private final String entityType;
    private final Object entityId;

    public EntityNotFoundException(String entityType, Object entityId) {
        super(entityType + " not found with id: " + entityId);
        this.entityType = entityType;
        this.entityId = entityId;
    }

    public String getEntityType() {
        return entityType;
    }

    public Object getEntityId() {
        return entityId;
    }
}
