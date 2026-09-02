class FormCraftException(Exception):
    """Primary runtime exception for FormCraft PLM business logic failures."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class EntityNotFoundException(FormCraftException):
    """Thrown when a requested entity is not found."""

    def __init__(self, entity_type: str, entity_id: object):
        self.entity_type = entity_type
        self.entity_id = entity_id
        super().__init__(f"{entity_type} not found with id: {entity_id}")


class FormulationException(FormCraftException):
    """Thrown when the formulation chain encounters an unrecoverable error."""

    def __init__(self, message: str, product_id: int | None, chain_id: str | None, cause: Exception | None = None):
        self.product_id = product_id
        self.chain_id = chain_id
        self.cause = cause
        super().__init__(message)
