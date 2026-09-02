import enum


class NcStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"

    def can_transition_to(self, target: "NcStatus") -> bool:
        match self:
            case NcStatus.OPEN:
                return target == NcStatus.IN_PROGRESS
            case NcStatus.IN_PROGRESS:
                return target in (NcStatus.CLOSED, NcStatus.OPEN)
            case NcStatus.CLOSED:
                return False
