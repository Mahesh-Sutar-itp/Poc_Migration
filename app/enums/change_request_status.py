import enum


class ChangeRequestStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"

    def can_transition_to(self, target: "ChangeRequestStatus") -> bool:
        match self:
            case ChangeRequestStatus.DRAFT:
                return target == ChangeRequestStatus.SUBMITTED
            case ChangeRequestStatus.SUBMITTED:
                return target == ChangeRequestStatus.UNDER_REVIEW
            case ChangeRequestStatus.UNDER_REVIEW:
                return target in (ChangeRequestStatus.APPROVED, ChangeRequestStatus.REJECTED)
            case ChangeRequestStatus.APPROVED:
                return target == ChangeRequestStatus.IMPLEMENTED
            case ChangeRequestStatus.REJECTED:
                return target == ChangeRequestStatus.DRAFT
            case ChangeRequestStatus.IMPLEMENTED:
                return False
