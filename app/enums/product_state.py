import enum


class ProductState(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_VALIDATION = "IN_VALIDATION"
    VALIDATED = "VALIDATED"
    ARCHIVED = "ARCHIVED"

    def can_transition_to(self, target: "ProductState") -> bool:
        match self:
            case ProductState.DRAFT:
                return target == ProductState.IN_VALIDATION
            case ProductState.IN_VALIDATION:
                return target in (ProductState.VALIDATED, ProductState.DRAFT)
            case ProductState.VALIDATED:
                return target == ProductState.ARCHIVED
            case ProductState.ARCHIVED:
                return False
